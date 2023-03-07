const FlightSuretyApp = require('../../build/contracts/FlightSuretyApp.json');
const FlightSuretyData = require('../../build/contracts/FlightSuretyData.json');
const Config = require('./config.json');
const Web3 = require('web3');
const express = require('express');

const config = Config['localhost'];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url));
web3.eth.defaultAccount = web3.eth.accounts[0];

const flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
const flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

const statusCodes = [0, 10, 20, 30, 40, 50];
const oracles = [];

flightSuretyApp.events.OracleRequest({ fromBlock: 0 },
  (error, event) => {
    if (error) console.log(error)
    const { index, airline, flight, timestamp } = event.returnValues;
    console.log("OracleRequest:", index, airline, flight, timestamp);
    console.log("Number of registered oracles:", oracles.length);
    oracles
      .filter((oracle) => oracle.indexes.includes(index))
      .forEach((oracle) => {
        const randomIndex = Math.floor(Math.random() * statusCodes.length);
        const statusCode = statusCodes[randomIndex];
        console.log("Submitting response:", statusCode);
        void flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode)
          .send({ from: oracle.address, gas: 3000000 })
          .catch(console.warn);
      });
  }
);

const registerOracles = async (n) => {
  try {
    const accounts = await web3.eth.getAccounts();
    await flightSuretyData.methods.authorizeCaller(config.appAddress).send({ from: accounts[0] });
    const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
    for (let i = 0; i < n; i++) {
      const address = accounts[i + 10];
      console.log("Registering oracle:", i, address);
      await flightSuretyApp.methods.registerOracle().send({ from: address, value: fee, gas: 3000000 });
      const indexes = await flightSuretyApp.methods.getMyIndexes().call({ from: address });
      oracles.push({ address, indexes });
    }
  } catch (err) {
    console.warn(err);
  }
}

void registerOracles(30);

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
