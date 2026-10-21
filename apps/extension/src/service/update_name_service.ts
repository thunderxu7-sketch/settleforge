import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';

interface Params {
  address: string;
  name: string;
}

const UPDATE_NAME_ACTION_NAME = 'UPDATE_NAME';

export const callUpdateNameService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(UPDATE_NAME_ACTION_NAME, data));
  return res;
};

export const registerUpdateNameService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', UPDATE_NAME_ACTION_NAME);

  messageHub.on(UPDATE_NAME_ACTION_NAME, async (data: Params, meta: DuplexMessageMetaType) => {
    const { address, name } = data;
    try {
      await accountManager.updateName(address, name);
      meta.resolve({});
    } catch (e: any) {
      meta.reject({
        message: e.message,
      });
    }
  });
};
