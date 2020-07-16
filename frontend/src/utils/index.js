export * from './sl';
export * from './xhr';
export * from './cache';
export * from './web3';

export function formatFiat(val, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    val
  );
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function toDaiWei(n) {
  return window.WEB3.utils.toWei(n, 'ether');
}

export function fromDaiWei(n) {
  return window.WEB3.utils.fromWei(n, 'ether');
}
