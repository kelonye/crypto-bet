import Promise from 'bluebird';
import NProgress from 'nprogress';

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
  if (!n) return;
  return window.WEB3.utils.fromWei(n, 'ether');
}

export function bn(n) {
  return new window.WEB3.utils.BN(n);
}

export async function waitForTxn(txHash, interval) {
  NProgress.start();
  NProgress.set(0.4);

  try {
    await waitForTxnPromise(txHash, interval);
  } finally {
    NProgress.done();
  }
}

export function waitForTxnPromise(txHash, interval) {
  const transactionReceiptRetry = () =>
    window.WEB3.eth
      .getTransactionReceipt(txHash)
      .then((receipt) =>
        receipt !== null
          ? receipt
          : Promise.delay(interval ? interval : 500).then(
              transactionReceiptRetry
            )
      );

  if (Array.isArray(txHash)) {
    return sequentialPromise(
      txHash.map((oneTxHash) => () => waitForTxnPromise(oneTxHash, interval))
    );
  } else if (typeof txHash === 'string') {
    return transactionReceiptRetry();
  } else {
    throw new Error('Invalid Type: ' + txHash);
  }
}

function sequentialPromise(promiseArray) {
  const result = promiseArray.reduce(
    (reduced, promise, index) => {
      reduced.results.push(undefined);
      return {
        chain: reduced.chain
          .then(() => promise())
          .then((result) => (reduced.results[index] = result)),
        results: reduced.results,
      };
    },
    {
      chain: Promise.resolve(),
      results: [],
    }
  );
  return result.chain.then(() => result.results);
}
