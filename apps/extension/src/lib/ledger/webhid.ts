import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import AppTrx from '@ledgerhq/hw-app-trx';
import Transport from '@ledgerhq/hw-transport';

import { MnemonicAccount } from '../../domain/account';
import { AddressInfoState } from '../../store/slices/address_info';

export type DeviceStatusType = 'LOCKED' | 'UNAUTHORIZED' | 'AUTHORIZED';

export class LedgerHidStatusChecker {
  static async getStatus() {
    let deviceType = '';
    let deviceStatus: DeviceStatusType = 'LOCKED';

    let transport;
    let appTrx;

    try {
      const path = "44'/195'/0'/0/0";
      transport = await TransportWebHID.create(3000, 5000);
      appTrx = new AppTrx(transport);
      if (transport && transport.deviceModel) {
        deviceType = transport.deviceModel.id;
      }
      await appTrx.getAddress(path, false);
      deviceStatus = 'AUTHORIZED';
    } catch (e) {
      if (transport && transport.deviceModel) {
        deviceStatus = 'UNAUTHORIZED';
      } else {
        deviceStatus = 'LOCKED';
      }
    } finally {
      await transport?.close();
    }

    return {
      deviceType,
      deviceStatus,
    };
  }
}

export class LedgerWebHid {
  transport?: Transport;
  appTrx?: AppTrx;

  async getAvailableAddress(addressItems: AddressInfoState['addressItems']) {
    let index = 0;
    let address: string;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const path = MnemonicAccount.getPath(index, 0);
      address = await this.getAddressByDefinePath(path);

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

  async getAddressByDefinePath(path: string) {
    try {
      await this.makeApp();
      const { address } = await this.appTrx!.getAddress(path);
      return address;
    } finally {
      await this.cleanUp();
    }
  }

  async signPersonalMessage(transaction: any, path: string) {
    try {
      await this.makeApp();
      let response = await this.appTrx!.signPersonalMessage(path, transaction);
      return response;
    } finally {
      this.cleanUp();
    }
  }

  async signTransaction(transaction: any, path: string) {
    try {
      await this.makeApp();
      let response = await this.appTrx!.signTransaction(path, transaction.hex, transaction.info);
      return response;
    } finally {
      this.cleanUp();
    }
  }

  async signTransactionHash(path: string, rawTxHashHex: string) {
    try {
      await this.makeApp();
      let response = await this.appTrx!.signTransactionHash(path, rawTxHashHex);
      return response;
    } finally {
      this.cleanUp();
    }
  }

  private async makeApp() {
    this.transport = await TransportWebHID.create();
    this.appTrx = new AppTrx(this.transport);
  }

  private async cleanUp() {
    this.appTrx = undefined;
    await this.transport?.close();
  }
}
