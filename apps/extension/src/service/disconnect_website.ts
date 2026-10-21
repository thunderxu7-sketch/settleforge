import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { requestAccountsManager } from '../domain/request_accounts_manager';
import { ConnectedWebsiteType } from '../store/slices/connected_website';

interface Params {
  address: string;
  webInfo: ConnectedWebsiteType;
}

const DISCONNECT_WEBSITE_ACTION_NAME = 'DISCONNECT_WEBSITE';

export const callDisconnectWebsiteService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(DISCONNECT_WEBSITE_ACTION_NAME, data));
  return res;
};

export const registerDisconnectWebsiteService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', DISCONNECT_WEBSITE_ACTION_NAME);

  messageHub.on(
    DISCONNECT_WEBSITE_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const { address, webInfo } = data;
      await requestAccountsManager.disconnectWebsite({ address, webInfo });

      meta.resolve({});
    },
  );
};
