export const COINS = ['BTC', 'ETH', 'LINK']; // ['BTC', 'ETH', 'LTC', 'BAND', 'ATOM', 'LINK', 'XTZ'];

export const DAY_STATES = {
  BET: 0,
  DRAWING: 1,
  PAYOUT: 2,
  INVALID: 3,
};

export const IS_DEV = window.location.hostname === 'localhost';

export const API_HOST = IS_DEV
  ? 'http://localhost:4848'
  : 'https://witnet.tools';
