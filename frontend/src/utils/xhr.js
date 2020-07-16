import NProgress from 'nprogress';
import { API_HOST } from '../config';

export async function xhr(method, endpoint, data) {
  NProgress.start();
  NProgress.set(0.4);

  try {
    const opts = {};
    if (data) {
      opts.method = method.toUpperCase();
      opts.body = JSON.stringify(data);
      opts.headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
    }
    const res = await fetch(`${API_HOST}${endpoint}`, opts);
    return await res.json();
  } finally {
    NProgress.done();
  }
}
