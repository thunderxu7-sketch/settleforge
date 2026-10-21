import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { requestAccountsManager } from '../domain/request_accounts_manager';

const APPROVE_CONNECT_WEBSITE_ACTION_NAME = 'APPROVE_CONNECT_WEBSITE';

export const callApproveConnectWebsiteService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(APPROVE_CONNECT_WEBSITE_ACTION_NAME));
  return res;
};

export const registerApproveConnectWebsiteService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', APPROVE_CONNECT_WEBSITE_ACTION_NAME);

  messageHub.on(
    APPROVE_CONNECT_WEBSITE_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      await requestAccountsManager.approveConnect();

      meta.resolve({});
    },
  );
};
