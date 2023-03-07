import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
  constructor(network, callback) {

    const config = Config[network];
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
    this.initialize(callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      console.warn(error);

      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }

      callback();
    });
  }

  async isOperational() {
    return await this.flightSuretyApp.methods
      .isOperational()
      .call({ from: this.owner });
  }

  async fetchFlightStatus(airlineAddress, flightNumber, departure) {
    const timestamp = Math.floor(departure.getTime() / 1000);
    await this.flightSuretyApp.methods
      .fetchFlightStatus(airlineAddress, flightNumber, timestamp)
      .send({ from: this.owner });
  }

  async buy(airlineAddress, flightNumber, departure, amount) {
    const value = this.web3.utils.toWei(amount);
    const timestamp = Math.floor(departure.getTime() / 1000);
    console.debug('value', value);
    await this.flightSuretyData.methods
      .buy(airlineAddress, flightNumber, timestamp)
      .send({ from: this.owner, value, gas: 3000000 });
  }

  async pay() {
    return await this.flightSuretyData.methods
      .pay()
      .send({ from: this.owner});
  }

  async getBalance() {
    return await this.web3.eth.getBalance(this.owner);
  }

  onFlightStatusInfo(callback) {
    this.flightSuretyApp.events.FlightStatusInfo({}, callback);
  }
}
