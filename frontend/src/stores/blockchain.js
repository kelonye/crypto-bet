// import NProgress from 'nprogress';
import { writable, get } from 'svelte/store';
import { sleep, Contract } from '../utils';
import BET_CONTRACT_JSON from '../data/contracts/Bet.json';
import DAI_CONTRACT_JSON from '../data/dai';

export const betContract = new Contract();
export const daiContract = new Contract();

export const address = writable(null);
export const info = writable(null);
export const myInfo = writable(null);
export const balance = writable('0');
export const networkInfo = writable({});

export async function load() {
  let networkId = 1;
  let networkName = 'main';

  if (window.WEB3_WRITES_ENABLED) {
    networkId = await window.WEB3.eth.net.getId();
    networkName = await window.WEB3.eth.net.getNetworkType();
  }

  const networkSupported = networkId in BET_CONTRACT_JSON.networks;

  networkInfo.set({ networkId, networkName, networkSupported });

  if (networkSupported) {
    betContract.setNetworkId(networkId);
    betContract.setContract(BET_CONTRACT_JSON);

    daiContract.setNetworkId(networkId);
    daiContract.setContract(DAI_CONTRACT_JSON);

    await Promise.all([loadInfo(), loadAccount()]);
  }
}

export async function connectAccount() {
  await window.ethereum.enable();
  await loadAccount();
}

export function disconnectAccount() {
  address.set(null);
}

async function loadInfo() {
  info.set({
    firstDay: await betContract.read('firstDay'),
  });
}

export async function loadAccount() {
  const addr = (await window.WEB3.eth.getAccounts())[0];
  address.set(addr);

  Promise.all([loadBalance(), loadMyInfo()]);
}

export async function loadBalance() {
  balance.set(await daiContract.read('balanceOf', [get(address)]));
}

export async function tryReloadBalance() {
  let b = get(balance);
  for (let i = 0; i < 3; i++) {
    if (b !== get(balance)) {
      break;
    }
    b = get(balance);
    await sleep(2000);
    await loadBalance();
  }
}

async function loadMyInfo() {}
