import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';

interface AuthParams {
  password: string;
}

const GET_KEY_STORE = 'GET_KEY_STORE';

export const callGetKeyStore = async (msgNode: MessageNode, data: AuthParams) => {
  const res = await msgNode.send(new DuplexMessage(GET_KEY_STORE, data, 15));
  return res;
};

export const registerGetKeyStore = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_KEY_STORE);

  messageHub.on(GET_KEY_STORE, async (data: AuthParams, meta: DuplexMessageMetaType) => {
    const { password } = data;
    const res = await accountManager.getKeyStore(password);
    meta.resolve(res);
  });
};
