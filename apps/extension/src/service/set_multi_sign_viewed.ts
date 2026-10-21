import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { multiSignManager } from '../domain/multi_sign_manager';

const SET_MULTI_SIGN_VIEWED_ACTION_NAME = 'SET_MULTI_SIGN_VIEWED';

export const callSetMultiSignViewedService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(SET_MULTI_SIGN_VIEWED_ACTION_NAME));
  return res;
};

export const registerSetMultiSignViewedService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', SET_MULTI_SIGN_VIEWED_ACTION_NAME);

  messageHub.on(
    SET_MULTI_SIGN_VIEWED_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      await multiSignManager.setMultiSignViewed();

      meta.resolve({});
    },
  );
};
