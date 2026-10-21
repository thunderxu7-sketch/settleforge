import log from 'loglevel';
import type { AxiosInstance } from 'axios';
import axios from 'axios';

// @ts-ignore
import TronWeb from 'tronweb';

const { HttpProvider } = TronWeb.providers;

interface QueueElement {
  args: any[];
  resolve: (value: any) => void;
  reject: () => void;
}

class ProxiedProvider extends HttpProvider {
  ready: boolean;
  queue: QueueElement[];
  chainType: any;

  host?: string;
  instance?: AxiosInstance;

  constructor(chainType = 0) {
    super('http://127.0.0.1');

    log.info('Provider initialised');

    this.ready = false;
    this.queue = [];
    this.chainType = chainType;
  }

  configure(url: string, headers = {}) {
    log.info('Received new node:', url);

    this.host = url;
    this.instance = axios.create({
      baseURL: url,
      timeout: 30000,
      headers: headers,
    });

    this.ready = true;

    while (this.queue.length) {
      const { args, resolve, reject } = this.queue.shift()!;

      // @ts-ignore
      this.request(...args)
        .then(resolve)
        .catch(reject)
        .then(() => log.info(`Completed the queued request to ${args[0]}`));
    }
  }

  request(endpoint: string, payload = {}, method = 'get') {
    if (!this.ready) {
      log.info(`Request to ${endpoint} has been queued`);

      return new Promise((resolve, reject) => {
        this.queue.push({
          args: [endpoint, payload, method],
          resolve,
          reject,
        });
      });
    }

    return super.request(endpoint, payload, method).then((res: any) => {
      const response = res.transaction || res;
      Object.defineProperty(response, '__payload__', {
        writable: false,
        enumerable: false,
        configurable: false,
        value: { ...payload, chainType: this.chainType },
      });
      return res;
    });
  }
}

export default ProxiedProvider;
