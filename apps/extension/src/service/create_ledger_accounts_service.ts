import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { sleep } from '../lib/async_func';
import { increaseStorageSequenceId } from '../domain/storege_sequence_ids';
import {
  storageAddressGenerateTypeManager,
  AddressGenerateType,
} from './utils/storageAddressGenerateTypeManager';

export interface LedgerAccountParam {
  address: string;
  accountIndex: number;
  addressIndex: number;
}

interface CreateLedgerAccountsParams {
  name: string;
  password?: string;
  accounts: LedgerAccountParam[];
}

const CREATE_LEDGER_ACCOUNTS_ACTION_NAME = 'CREATE_LEDGER_ACCOUNTS';

export const callCreateLedgerAccountsService = async (
  msgNode: MessageNode,
  data: CreateLedgerAccountsParams,
) => {
  const res = await msgNode.send(new DuplexMessage(CREATE_LEDGER_ACCOUNTS_ACTION_NAME, data));
  return res;
};

export const registerCreateLedgerAccountsService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', CREATE_LEDGER_ACCOUNTS_ACTION_NAME);

  messageHub.on(
    CREATE_LEDGER_ACCOUNTS_ACTION_NAME,
    async (data: CreateLedgerAccountsParams, meta: DuplexMessageMetaType) => {
      const { name, password, accounts } = data;

      if (password) {
        accountManager.setData(password);
      }

      try {
        let selectedSet = false;

        const isDerived = accounts.length > 1;

        for (let index = 0; index < accounts.length; ++index) {
          const { address, accountIndex, addressIndex } = accounts[index];
          let formatName = name;
          if (isDerived) {
            formatName = `${name} #${accountIndex}`;
          }
          await accountManager.importLedgerAccount(formatName, address, accountIndex, addressIndex);

          if (!selectedSet) {
            accountManager.setSelectedAddress(address);
            selectedSet = true;
          }

          storageAddressGenerateTypeManager.setAddressGenerateType(
            address,
            AddressGenerateType.LEDGER,
          );
        }

        await increaseStorageSequenceId('ledgerName');
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
