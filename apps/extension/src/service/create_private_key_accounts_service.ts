import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { sleep } from '../lib/async_func';
import { increaseStorageSequenceId } from '../domain/storege_sequence_ids';
import {
  storageAddressGenerateTypeManager,
  AddressGenerateType,
} from './utils/storageAddressGenerateTypeManager';

export interface PrivateKeyAccountParam {
  privateKey: string;
  address: string;
  isOld: boolean;
}

interface CreatePrivateKeyAccountsParams {
  name: string;
  password?: string;
  accounts: PrivateKeyAccountParam[];
}

const CREATE_PRIVATE_KEY_ACCOUNTS_ACTION_NAME = 'CREATE_PRIVATE_KEY_ACCOUNTS';

export const callCreatePrivateAccountsService = async (
  msgNode: MessageNode,
  data: CreatePrivateKeyAccountsParams,
) => {
  const res = await msgNode.send(new DuplexMessage(CREATE_PRIVATE_KEY_ACCOUNTS_ACTION_NAME, data));
  return res;
};

export const registerCreatePrivateAccountsService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', CREATE_PRIVATE_KEY_ACCOUNTS_ACTION_NAME);

  messageHub.on(
    CREATE_PRIVATE_KEY_ACCOUNTS_ACTION_NAME,
    async (data: CreatePrivateKeyAccountsParams, meta: DuplexMessageMetaType) => {
      const { name, password, accounts } = data;
      if (password) {
        accountManager.setData(password);
      }

      try {
        let selectedSet = false;

        for (const account of accounts) {
          const { address, privateKey, isOld } = account;
          await accountManager.importPrivateKeyAccount(name, privateKey, address, isOld);

          if (!selectedSet) {
            accountManager.setSelectedAddress(address);
            selectedSet = true;
          }

          storageAddressGenerateTypeManager.setAddressGenerateType(
            address,
            AddressGenerateType.PRIVATE_KEY_IMPORT,
          );
        }

        await increaseStorageSequenceId('importName');
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
