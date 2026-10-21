/*
 * storage address generate type for local address generation tracking
 */
import log from 'loglevel';
import _ from 'lodash';

import { chromeStorage } from '../../lib/storage';
import { ADDRESS_GENERATE_TYPE } from '../../constants/storage_keys';

export enum AddressGenerateType {
  MNEMONIC_CREATE = 1,
  MNEMONIC_IMPORT = 11,
  PRIVATE_KEY_IMPORT = 2,
  LEDGER = 8,
  // not used
  PRIVATE_KEY_CREATE = 10,
  WATCHER = 3,
  COLD_WALLET = 9,
}

export interface AllAddressGenerateType {
  [k: string]: AddressGenerateType;
}

interface StorageAddressGenerateType {
  lastReportTime: number;
  allAddressGenerateType: AllAddressGenerateType;
}

class StorageAddressGenerateTypeManager {
  static #instance: StorageAddressGenerateTypeManager;

  public static getInstance(): StorageAddressGenerateTypeManager {
    if (!StorageAddressGenerateTypeManager.#instance) {
      StorageAddressGenerateTypeManager.#instance = new StorageAddressGenerateTypeManager();
    }

    return StorageAddressGenerateTypeManager.#instance;
  }

  async getLastReportTime(): Promise<number | null> {
    try {
      const res: StorageAddressGenerateType = await chromeStorage.getItem(ADDRESS_GENERATE_TYPE);
      return _.get(res, 'lastReportTime', null);
    } catch (error) {
      log.info('getLastReportTime error: ', error);
      return null;
    }
  }

  async setLastReportTime() {
    const nowTime = new Date().getTime();
    try {
      const res: StorageAddressGenerateType = await chromeStorage.getItem(ADDRESS_GENERATE_TYPE);

      res.lastReportTime = nowTime;

      await chromeStorage.setItem(ADDRESS_GENERATE_TYPE, res);
    } catch (error) {
      log.info('getLastReportTime error: ', error);
    }
  }

  async getAddressGenerateType(address: string): Promise<number> {
    try {
      const res: StorageAddressGenerateType =
        (await chromeStorage.getItem(ADDRESS_GENERATE_TYPE)) ?? {};

      return _.get(res, `allAddressGenerateType[${address}]`, 1);
    } catch (error) {
      log.info('getAddressGenerateType error: ', error);
      return 1;
    }
  }

  async getAllAddressGenerateType(): Promise<AllAddressGenerateType> {
    const res: StorageAddressGenerateType =
      (await chromeStorage.getItem(ADDRESS_GENERATE_TYPE)) ?? {};

    return _.get(res, 'allAddressGenerateType', {});
  }

  async setAddressGenerateType(address: string, type: AddressGenerateType) {
    try {
      const res: StorageAddressGenerateType =
        (await chromeStorage.getItem(ADDRESS_GENERATE_TYPE)) ?? {};

      const allAddressGenerateType: AllAddressGenerateType = _.get(
        res,
        'allAddressGenerateType',
        {},
      );
      allAddressGenerateType[address] = type;

      res.allAddressGenerateType = allAddressGenerateType;

      chromeStorage.setItem(ADDRESS_GENERATE_TYPE, res);
    } catch (error) {
      log.info('setAddressGenerateType error: ', error);
    }
  }
}

export const storageAddressGenerateTypeManager = StorageAddressGenerateTypeManager.getInstance();
