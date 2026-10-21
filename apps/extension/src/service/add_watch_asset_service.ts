import log from 'loglevel';

import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { watchAssetManager } from '../domain/watch_asset_manager';
import { TokenItemType } from './get_watch_asset_service';
import { addAsset } from './local_data_service';
import { accountManager } from '../domain/account_manager';

interface Params {
  tokens?: TokenItemType[];
}

const ADD_WATCH_ASSET_ACTION_NAME = 'ADD_WATCH_ASSET';

export const callAddWatchAssetService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(ADD_WATCH_ASSET_ACTION_NAME, data));
  return res;
};

export const registerAddWatchAssetService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ADD_WATCH_ASSET_ACTION_NAME);

  messageHub.on(ADD_WATCH_ASSET_ACTION_NAME, async (data: Params, meta: DuplexMessageMetaType) => {
    const { tokens } = data;

    if (tokens) {
      const token10 = [];
      const token20 = [];
      const token721 = [];
      for (const tokenItem of tokens) {
        switch (tokenItem.type) {
          case 1:
            token10.push(tokenItem.address);
            break;
          case 2:
            token20.push(tokenItem.address);
            break;
          case 5:
            token721.push(tokenItem.address);
            break;
          default:
            break;
        }
      }

      const params: Record<string, any> = {};
      if (token10.length) {
        params.token10 = token10;
      }
      if (token20.length) {
        params.token20 = token20;
      }
      if (token721.length) {
        params.token721 = token721;
      }
      const selectedAddress = accountManager.getSelectedAddress();

      const res = await addAsset(selectedAddress, params);
      if (!res.success) {
        log.error('add watch asset error');
      }
    }
    await watchAssetManager.closePopup();
    meta.resolve({});
  });
};
