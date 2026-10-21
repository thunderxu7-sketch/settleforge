import { AddressInfoState } from '../../store/slices/address_info';
import { sleep } from '../async_func';

export class LedgerBridgeController {
  iframeLoaded: boolean;
  iframe?: HTMLIFrameElement;
  bridgeUrl: string;
  isLoading: boolean;

  constructor() {
    this.iframeLoaded = false;
    this.iframe = undefined;
    // Local-only build: the remote Ledger Live bridge is disabled.
    this.bridgeUrl = '';
    this.isLoading = false;
  }

  setupIframe() {
    if (this.isLoading || this.iframeLoaded) {
      return;
    }
    this.isLoading = true;
    this.iframeLoaded = true;
    this.isLoading = false;
  }

  _sendMessage(msg: any, cb: (data: any) => void) {
    if (!this.iframe?.contentWindow) {
      cb?.({ success: false, error: 'Ledger Live bridge is disabled in local-only mode.' });
      return;
    }
    msg.target = 'LEDGER-IFRAME';
    this.iframe!.contentWindow!.postMessage(msg, '*');
    const eventListener = ({ origin, data }: { origin: any; data: any }) => {
      const targetOrigin = this._getOrigin();

      if (targetOrigin && origin !== targetOrigin) {
        return false;
      }

      if (data?.action === `${msg.action}-reply` && data?.target === 'LEDGER-IFRAME' && cb) {
        cb(data);
      }
      window.removeEventListener('message', eventListener);
      return undefined;
    };
    window.addEventListener('message', eventListener);
  }

  _getOrigin() {
    let origin;
    try {
      origin = new URL(this.bridgeUrl).origin;
    } catch (e) {
      console.error('_getOrigin err:', e);
    }
    return origin;
  }

  _checkLoaded() {
    if (!this.iframeLoaded) {
      throw new Error('call setupIframe first');
    }
  }

  sendTrxByBridge(data = {}) {
    this._checkLoaded();

    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'send trx',
          data,
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  sendTrc20ByBridge(data = {}) {
    this._checkLoaded();

    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'send trc20',
          data,
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  sendTrc721ByBridge(data = {}) {
    this._checkLoaded();

    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'send trc721',
          data,
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  sendTrc10ByBridge(data = {}) {
    this._checkLoaded();

    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'send trc10',
          data,
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  cancelTransactionByBridge(data = {}) {
    this._checkLoaded();

    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'cancel transaction',
          data,
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  connectLedgerMulti(data = {}) {
    this._checkLoaded();

    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'connect ledger multi',
          data,
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  signTransactionMulti(data = {}) {
    this._checkLoaded();

    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'sign transaction',
          data,
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  async approveLedgerAccount(index: number) {
    this._checkLoaded();

    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'getAccount',
          data: {
            path: this._getPath(index),
            confirm: true,
          },
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  async getLedgerStatus(index: number) {
    this._checkLoaded();

    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'getStatus',
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  async getLedgerAccounts({ start, end }: { start: number; end: number }) {
    this._checkLoaded();

    const addresses = [];
    let hasError = false;
    await this.delay(200);
    for (let i = start; i < end; i++) {
      const address = await this._getAccount(i);
      if (address) {
        addresses.push({ address, index: i });
      } else {
        hasError = true;
        break;
      }
    }
    if (hasError) {
      return { success: false, error: 'error .' };
    }
    return { success: true, addresses };
  }

  _getAccount(index: number) {
    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'getAccount',
          data: {
            path: this._getPath(index),
          },
        },
        (res) => {
          const { success, address, error } = res;
          resolve(address);
        },
      );
    });
  }

  async getLedgerAccountByDefinePath(accountIndex: number, addressIndex: number): Promise<string> {
    this._checkLoaded();

    const { success, address, error } = await this._getAccountByDefinePath(
      accountIndex,
      addressIndex,
    );

    if (!success) {
      return '';
    }

    return address as string;
  }

  _getAccountByDefinePath(accountIndex: number, addressIndex: number): any {
    return new Promise((resolve, reject) => {
      this._sendMessage(
        {
          action: 'getAccount',
          data: {
            path: this._getPathPro(accountIndex, addressIndex),
          },
        },
        (res) => {
          resolve(res);
        },
      );
    });
  }

  _getPath(index: number) {
    return "44'/195'/" + index + "'/0/0";
  }

  _getPathPro(accountIndex = 0, addressIndex = 0) {
    return `44'/195'/${accountIndex}'/0/${addressIndex}`;
  }

  delay(ms: number) {
    return new Promise((success) => setTimeout(success, ms));
  }

  async getAvailableAddress(addressItems: AddressInfoState['addressItems']) {
    this._checkLoaded();

    let index = 0;
    let address: string;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      address = (await this.getLedgerAccountByDefinePath(index, 0))!;

      if (!(address in addressItems)) {
        break;
      }

      index++;
    }

    return {
      index,
      address,
    };
  }

  async waitUntilLoaded() {
    this.setupIframe();
    while (!this.iframeLoaded) {
      await sleep(100);
    }
  }
}

export const ledgerBridgeController = new LedgerBridgeController();
