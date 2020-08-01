require("dotenv").config()
const HDWalletProvider = require("@truffle/hdwallet-provider")
const Web3 = require('web3');

exports.Web3 = function () {
  const provider = new HDWalletProvider(
    process.env.MNENOMIC,
    "https://rinkeby.infura.io/v3/" + process.env.INFURA_API_KEY,
    0
  );

  return new Web3(provider);
}

exports.Contract = class {
  constructor(web3, networkId, json, account) {
    this.account  = account;
    const network = json.networks[networkId];
    this.contract = new web3.eth.Contract(json.abi, network.address);
  }

  async read(method, args = [], options = {}) {
    return this.callContract(false, method, args, options);
  }

  async write(method, args = [], options = {}) {
    return this.callContract(true, method, args, options);
  }

  async callContract(write, method, args) {
    return new Promise((resolve, reject) => {
      this.contract.methods[method](...args)[write ? 'send' : 'call'](
        {from: this.account,       gas: 3000000,
          gasPrice: 10000000000,},
        (err, response) => {
          if (err) {
            return reject(new Error(err.message));
          }
          if (response.c && response.c.length) {
            return resolve(response.c);
          }
          resolve(response);
          // resolve(response.c?.[0] ?? response);
        }
      );
    });
  }

  on(eventName, fn) {
    return this.contract.events[eventName]({}, fn);
  }
}
