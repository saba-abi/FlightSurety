const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = "private drastic exile dance menu skin eternal chapter frog smile vast option";

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