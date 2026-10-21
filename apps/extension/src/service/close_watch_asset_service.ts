import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { watchAssetManager } from '../domain/watch_asset_manager';

const CLOSE_WATCH_ASSET_ACTION_NAME = 'CLOSE_WATCH_ASSET';

export const callCloseWatchAssetService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(CLOSE_WATCH_ASSET_ACTION_NAME));
  return res;
};

export const registerCloseWatchAssetService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', CLOSE_WATCH_ASSET_ACTION_NAME);

  messageHub.on(
    CLOSE_WATCH_ASSET_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      await watchAssetManager.notifySecondaryPopupClose();
      meta.resolve({});
    },
  );
};
