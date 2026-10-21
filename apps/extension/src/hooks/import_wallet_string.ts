import { chromeStorage } from '../lib/storage';
import { IMPORT_WALLET_STRING } from '../constants/storage_keys';

export const getImportWalletString = async (): Promise<string> => {
  return await chromeStorage.getItem(IMPORT_WALLET_STRING);
};

export const setImportWalletString = (value: string) => {
  chromeStorage.setItem(IMPORT_WALLET_STRING, value);
};

export const clearImportWalletString = () => {
  chromeStorage.setItem(IMPORT_WALLET_STRING, '');
};
