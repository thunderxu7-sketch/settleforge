import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { requestAccountsManager } from '../domain/request_accounts_manager';
import type { ConnectedWebsiteType } from '../store/slices/connected_website';

interface Params {
  address: string;
  webInfo: ConnectedWebsiteType;
}

const CONNECT_WEBSITE_ACTION_NAME = 'CONNECT_WEBSITE';

export const callConnectWebsiteService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(CONNECT_WEBSITE_ACTION_NAME, data));
  return res;
};

export const registerConnectWebsiteService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', CONNECT_WEBSITE_ACTION_NAME);

  messageHub.on(CONNECT_WEBSITE_ACTION_NAME, async (data: Params, meta: DuplexMessageMetaType) => {
    const { address, webInfo } = data;
    await requestAccountsManager.connectWebsite({ address, webInfo, isFromAuthPage: false });

    meta.resolve({});
  });
};
