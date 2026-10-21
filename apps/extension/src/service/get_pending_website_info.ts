import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { requestAccountsManager } from '../domain/request_accounts_manager';

const GET_PENDING_WEBSITE_INFO_ACTION_NAME = 'GET_PENDING_WEBSITE_INFO';

export const callGetPendingWebsiteInfoService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(GET_PENDING_WEBSITE_INFO_ACTION_NAME));
  return res;
};

export const registerGetPendingWebsiteInfoService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_PENDING_WEBSITE_INFO_ACTION_NAME);

  messageHub.on(
    GET_PENDING_WEBSITE_INFO_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      const res = requestAccountsManager.pendingWebsiteInfo();

      meta.resolve(res);
    },
  );
};
