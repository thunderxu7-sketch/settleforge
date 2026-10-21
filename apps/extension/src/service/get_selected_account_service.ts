import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';

interface Params {
  address?: string;
}

const GET_SELECTED_ACCOUNT_ACTION_NAME = 'GET_SELECTED_ACCOUNT';

export const callGetSelectedAccountService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(GET_SELECTED_ACCOUNT_ACTION_NAME, data));
  return res;
};

export const registerGetSelectedAccountService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_SELECTED_ACCOUNT_ACTION_NAME);

  messageHub.on(
    GET_SELECTED_ACCOUNT_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const selected = await accountManager.getSelected();

      meta.resolve({
        selected,
      });
    },
  );
};
