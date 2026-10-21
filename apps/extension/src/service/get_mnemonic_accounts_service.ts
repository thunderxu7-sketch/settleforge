import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';

interface Params {
  address?: string;
}

const GET_MNEMONIC_ACCOUNT_ACTION_NAME = 'GET_MNEMONIC_ACCOUNT';

export const callGetMnemonicAccountsService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(GET_MNEMONIC_ACCOUNT_ACTION_NAME, data));
  return res;
};

export const registerGetMnemonicsAccountService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_MNEMONIC_ACCOUNT_ACTION_NAME);

  messageHub.on(
    GET_MNEMONIC_ACCOUNT_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const mnemonicAccounts = await accountManager.getMnemonicAccounts();
      const selected = await accountManager.getSelected();

      meta.resolve({
        mnemonicAccounts,
        selected,
      });
    },
  );
};
