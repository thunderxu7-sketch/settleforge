import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';

const GET_IS_AUTHED_ACTION_NAME = 'GET_IS_AUTHED';

export const callGetIsAuthedService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(GET_IS_AUTHED_ACTION_NAME));
  return res;
};

export const registerGetIsAuthedService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_IS_AUTHED_ACTION_NAME);

  messageHub.on(GET_IS_AUTHED_ACTION_NAME, async (data: undefined, meta: DuplexMessageMetaType) => {
    const isLocked = accountManager.isLocked();

    meta.resolve({
      isAuthed: !isLocked,
    });
  });
};
