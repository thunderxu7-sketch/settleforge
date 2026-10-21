import _ from 'lodash';
// @ts-ignore
import TronWeb from 'tronweb';

import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { watchAssetManager } from '../domain/watch_asset_manager';
import { getCurrentNode, searchTokens } from './local_data_service';
import { accountManager } from '../domain/account_manager';
import { getStore, RootState } from '../store/store';

export interface TokenItemType {
  address: string;
  type: number;
  isInAssets: boolean;

  isOfficial?: number;
  name?: string;
  shortName?: string;
  balanceStr?: string;
  logoUrl?: string;
  balance: number;
  price: number;
}

const GET_WATCH_ASSET_ACTION_NAME = 'GET_WATCH_ASSET';

export const callGetWatchAssetService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(GET_WATCH_ASSET_ACTION_NAME));
  return res;
};

export const registerGetWatchAssetService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_WATCH_ASSET_ACTION_NAME);

  messageHub.on(
    GET_WATCH_ASSET_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      const addresses = watchAssetManager.getWatchAsset();
      const rootState: RootState = getStore().getState();
      const selectedNode = rootState.nodeManagement.selectedNode;
      const node = getCurrentNode();

      const tokens = [];
      const selectedAddress = accountManager.getSelectedAddress();
      let isValid = false;
      let isFailed = true;

      for (const address of addresses) {
        const tokenItem = await searchToken(selectedAddress, selectedNode, address);

        if (!isValid && [0, 1, 2, 5].includes(tokenItem.type)) {
          isValid = true;
        }
        if (tokenItem.type !== -1) {
          isFailed = false;
        }

        tokens.push(tokenItem);
      }

      meta.resolve({
        tokens,
        isValid,
        isFailed,
        hostname: node.hostname,
      });
    },
  );
};

async function searchToken(selectedAddress: string, selectedNode: string, address: string) {
  const tokenItem: TokenItemType = {
    address,
    type: -1,
    isInAssets: false,
    price: 0,
    balance: 0,
  };

  if (!isValidAddress(address)) {
    return tokenItem;
  }

  const searchRes = await searchTokens(selectedAddress, address);

  if (!searchRes.success) {
    return tokenItem;
  }

  const targetToken = searchRes.data.token[0];

  if (!targetToken) {
    return tokenItem;
  }

  const {
    type,
    isOfficial,
    name,
    shortName,
    balance,
    balanceStr,
    logoUrl,
    price = 0,
    isInAssets = false,
  } = targetToken;

  Object.assign(tokenItem, {
    type,
    name,
    balanceStr,
    balance,
    price,
    isOfficial,
    shortName,
    logoUrl,
    isInAssets,
  });

  return tokenItem;
}

function isValidAddress(address: string) {
  return address.match(/^[1-9]\d{6}$/) || TronWeb.isAddress(address);
}
