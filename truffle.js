const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = "other glory citizen fury valid public era long neutral present nominee bracket";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '*',
      gas: 9999999
    }
  },
  compilers: {
    solc: {
      version: "^0.8.17"
    }
  }
};