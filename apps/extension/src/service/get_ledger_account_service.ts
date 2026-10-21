import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';

interface Params {
  address?: string;
}

const GET_LEDGER_ADDRESS_INFO_ACTION_NAME = 'GET_LEDGER_ACCOUNT';

export const callGetLedgerAccountService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(GET_LEDGER_ADDRESS_INFO_ACTION_NAME, data));
  return res;
};

export const registerGetLedgerAccountService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_LEDGER_ADDRESS_INFO_ACTION_NAME);

  messageHub.on(
    GET_LEDGER_ADDRESS_INFO_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const ledgerAccount = await accountManager.getLedgerAccount();
      const selected = await accountManager.getSelected();

      meta.resolve({
        ledgerAccount,
        selected,
      });
    },
  );
};
