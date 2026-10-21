import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { MnemonicAccount } from '../domain/account';

interface Params {
  address?: string;
}

const GET_NEW_ADDRESS_INFO_ACTION_NAME = 'GET_MNEMONIC_COUNT';

export const callGetMnemonicCountService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(GET_NEW_ADDRESS_INFO_ACTION_NAME, data));
  return res;
};

export const registerGetMnemonicCountService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_NEW_ADDRESS_INFO_ACTION_NAME);

  messageHub.on(
    GET_NEW_ADDRESS_INFO_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const mnemonicAccountCount = await accountManager.getMnemonicAccountCount();

      meta.resolve({
        mnemonicAccountCount,
      });
    },
  );
};
