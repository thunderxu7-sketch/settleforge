import { chromeStorage } from '../lib/storage';
import { SEQUENCE_IDS } from '../constants/storage_keys';

export type IdKeyType = 'commonName' | 'importName' | 'ledgerName';

export interface StorageSequenceIds {
  commonName?: number;
  importName?: number;
  ledgerName?: number;
}

export async function getStorageSequenceId(idKey: IdKeyType) {
  const ids = (await chromeStorage.getItem<StorageSequenceIds>(SEQUENCE_IDS)) || {};
  if (ids[idKey] != undefined) {
    return ids[idKey];
  } else {
    return await increaseStorageSequenceId(idKey);
  }
}

export async function increaseStorageSequenceId(idKey: IdKeyType) {
  const oldIds = (await chromeStorage.getItem<StorageSequenceIds>(SEQUENCE_IDS)) || {};

  let newId = oldIds[idKey];
  if (newId == undefined) {
    newId = 0;
  } else {
    newId = newId + 1;
  }
  const newIds = {
    ...oldIds,
    [idKey]: newId,
  };

  await chromeStorage.setItem(SEQUENCE_IDS, newIds);
  return newId;
}
