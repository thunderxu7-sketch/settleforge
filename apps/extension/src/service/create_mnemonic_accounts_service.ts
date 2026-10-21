import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { sleep } from '../lib/async_func';
import { IdKeyType, increaseStorageSequenceId } from '../domain/storege_sequence_ids';
import {
  storageAddressGenerateTypeManager,
  AddressGenerateType,
} from './utils/storageAddressGenerateTypeManager';

export interface MnemonicAccountParam {
  address: string;
  accountIndex: number;
  addressIndex: number;
}

interface CreateMnemonicAccountsParams {
  mnemonic: string;
  name: string;
  password?: string;
  accounts: MnemonicAccountParam[];
  idKey: IdKeyType;
}

const CREATE_MNEMONIC_ACCOUNTS_ACTION_NAME = 'CREATE_MNEMONIC_ACCOUNTS';

export const callCreateMnemonicAccountsService = async (
  msgNode: MessageNode,
  data: CreateMnemonicAccountsParams,
) => {
  const res = await msgNode.send(new DuplexMessage(CREATE_MNEMONIC_ACCOUNTS_ACTION_NAME, data));
  return res;
};

export const registerCreateMnemonicAccountsService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', CREATE_MNEMONIC_ACCOUNTS_ACTION_NAME);

  messageHub.on(
    CREATE_MNEMONIC_ACCOUNTS_ACTION_NAME,
    async (data: CreateMnemonicAccountsParams, meta: DuplexMessageMetaType) => {
      const { mnemonic, name, password, accounts, idKey } = data;

      if (password) {
        accountManager.setData(password);
      }

      try {
        let selectedSet = false;

        for (const account of accounts) {
          const { address, accountIndex, addressIndex } = account;
          await accountManager.importMnemonicAccount(
            name,
            mnemonic,
            address,
            accountIndex,
            addressIndex,
          );

          if (!selectedSet) {
            accountManager.setSelectedAddress(address);
            selectedSet = true;
          }

          storageAddressGenerateTypeManager.setAddressGenerateType(
            address,
            idKey === 'commonName'
              ? AddressGenerateType.MNEMONIC_CREATE
              : AddressGenerateType.MNEMONIC_IMPORT,
          );
        }

        await increaseStorageSequenceId(idKey);
      } catch (e: any) {
        meta.reject({
          message: e.message,
        });
      }
      await sleep(100);
      meta.resolve({});
    },
  );
};
