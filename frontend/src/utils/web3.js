import Promise from 'bluebird';
import Web3 from 'web3/dist/web3.js';

export const WRITES_ENABLED = typeof window.web3 !== 'undefined';

export const WEB3 = new Web3(
  WRITES_ENABLED
    ? window.web3.currentProvider
    : new Web3.providers.HttpProvider(
        'https://rinkeby.infura.io/v3/90b4177113144a0c82b2b64bc01950e1'
      )
);

window.WEB3 = WEB3;
window.WEB3_WRITES_ENABLED = WRITES_ENABLED;

export class Contract {
  setNetworkId(networkId) {
    this.networkId = networkId;
  }

  setContract(json) {
    const network = json.networks[this.networkId];
    this.address = network.address;
    this.contract = new window.WEB3.eth.Contract(json.abi, this.address);
  }

  setAccount(account) {
    this.account = account;
  }

  async read(method, args = [], options = {}) {
    return this.callContract(false, method, args, options);
  }

  async write(method, args = [], options = {}) {
    return this.callContract(true, method, args, options);
  }

  async callContract(write, method, args) {
    return new Promise((resolve, reject) => {
      const options = {};
      if (this.account) {
        options.from = this.account;
      }
      this.contract.methods[method](...args)[write ? 'send' : 'call'](
        options,
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
