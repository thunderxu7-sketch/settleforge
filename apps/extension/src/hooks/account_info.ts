import { chromeStorage } from '../lib/storage';
import { ACCOUNT_INFO } from '../constants/storage_keys';

/**
 *  CAUTION: ONLY FOR IMPORT ACCOUNT, EXPORT ACCOUNT, PLEASE DO NOT USE FROMPAGE ON OTHER PAGE
 */

export const setAccountInfo = async (key: string, value: string) => {
  const object: any = (await chromeStorage.getItem(ACCOUNT_INFO)) || {};
  object[key] = value;
  await chromeStorage.setItem(ACCOUNT_INFO, object);
};

export const getAccountInfo = async (key: string) => {
  const object: any = (await chromeStorage.getItem(ACCOUNT_INFO)) || {};
  return object[key] ? object[key] : '';
};
