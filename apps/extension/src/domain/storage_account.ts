import _ from 'lodash';
// @ts-ignore
import encryptor from 'browser-passworder';

import { chromeStorage } from '../lib/storage';
import { KEYRING } from '../constants/storage_keys';

export interface MnemonicAddress {
  privateKey: string;
  accountIndex: number;
  addressIndex: number;
}

export interface MnemonicAddressDetails {
  [key: string]: MnemonicAddress;
}

export interface LedgerAddress {
  accountIndex: number;
  addressIndex: number;
}

export interface LedgerAddressDetails {
  [key: string]: LedgerAddress;
}

export interface StoragePrivateAccountType {
  type: 'private_key';
  privateKey: string;
  address: string;
}

export interface StorageMnemonicAccountType {
  type: 'mnemonic';
  mnemonicPhase: string;
  addressDetails: MnemonicAddressDetails;
  remind: boolean;
}

export interface StorageLedgerAccountType {
  type: 'ledger';
  addressDetails: LedgerAddressDetails;
}

export type StorageAccountType =
  | StoragePrivateAccountType
  | StorageMnemonicAccountType
  | StorageLedgerAccountType;

export interface StorageAccounts {
  [key: string]: StorageAccountType;
}

export async function getStorageAccounts(trlk: string): Promise<StorageAccounts> {
  const encrypted = await chromeStorage.getItem<string>(KEYRING);
  let result: StorageAccounts;
  if (!encrypted) {
    result = {};
  } else {
    result = await encryptor.decrypt(trlk, encrypted);
  }
  return result;
}

export async function upsertStorageAccount(trlk: string, storageAccounts: StorageAccounts) {
  const oldStorageAccounts = await getStorageAccounts(trlk);
  const newAccounts = {
    ...oldStorageAccounts,
    ...storageAccounts,
  };

  const encrypted = await encryptor.encrypt(trlk, newAccounts);
  await chromeStorage.setItem(KEYRING, encrypted);
}

export async function deleteAccount(password: string, accountId: string) {
  const oldStorageAccounts = await getStorageAccounts(password);
  const newAccounts = _.omit(oldStorageAccounts, accountId);

  const encrypted = await encryptor.encrypt(password, newAccounts);
  await chromeStorage.setItem(KEYRING, encrypted);
}
