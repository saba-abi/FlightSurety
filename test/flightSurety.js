
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it('(multiparty) has correct initial isOperational() value', async () => {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it('(multiparty) can block access to setOperatingStatus() for non-Contract Owner account', async () => {

    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
    }
    catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

  });

  it('(multiparty) can allow access to setOperatingStatus() for Contract Owner account', async () => {

    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    }
    catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

  });

  it('(multiparty) can block access to functions using requireIsOperational when operating status is false', async () => {

    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try {
      await config.flightSurety.setTestingMode(true);
    }
    catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline });
    }
    catch (e) {

    }

    const result = await config.flightSuretyData.isRegisteredAirline.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it.only('(airline) can register an Airline using registerAirline() if funded 10 ETH', async () => {

    // ARRANGE
    let newAirline = accounts[2];

    await config.flightSuretyData.fund({ from: config.firstAirline, value: 10 * config.weiMultiple });

    // ACT
    await config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline });

    const result = await config.flightSuretyData.isRegisteredAirline.call(newAirline);

    // ASSERT
    assert.equal(result, true, "Airline should be able to register another airline if it has provided enough funding");

  });
});
