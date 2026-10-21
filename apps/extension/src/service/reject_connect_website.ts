import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { requestAccountsManager } from '../domain/request_accounts_manager';

const REJECT_CONNECT_WEBSITE_ACTION_NAME = 'REJECT_CONNECT_WEBSITE';

export const callRejectConnectWebsiteService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(REJECT_CONNECT_WEBSITE_ACTION_NAME));
  return res;
};

export const registerRejectConnectWebsiteService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', REJECT_CONNECT_WEBSITE_ACTION_NAME);

  messageHub.on(
    REJECT_CONNECT_WEBSITE_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      await requestAccountsManager.rejectConnect();

      meta.resolve({});
    },
  );
};
