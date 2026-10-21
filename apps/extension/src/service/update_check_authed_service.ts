import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { updateCheckAuthed } from '../store/slices/notification';
import { getStore } from '../store/store';

const UPDATE_CHECK_AUTHED_ACTION_NAME = 'UPDATE_CHECK_AUTHED';

export const callUpdateCheckAuthedService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(UPDATE_CHECK_AUTHED_ACTION_NAME));
  return res;
};

export const registerUpdateCheckAuthedService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', UPDATE_CHECK_AUTHED_ACTION_NAME);

  messageHub.on(
    UPDATE_CHECK_AUTHED_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      getStore().dispatch(updateCheckAuthed());
      meta.resolve({});
    },
  );
};
