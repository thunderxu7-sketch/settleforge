import _ from 'lodash';
import log from 'loglevel';

import { AllLocalTokensType, AssetType } from '../constants/types';
import { chromeStorage } from '../lib/storage';
import { getStore } from '../store/store';
import { PriceInfoType, updatePrices } from '../store/slices/prices';
import {
  fetchAccountsTotalTrx,
  fetchFollowedAssetList,
  fetchFollowedCollectionList,
  fetchNewAssetList,
  fetchUnFollowedAssetList,
  fetchUnFollowedCollectionList,
  getHotTokens,
} from '../service/local_data_service';
import { getAccountResourcesByAddress, getTokenId } from '../popup/utils/assetUtils';
import { RESOURCE_INFO } from '../constants/storage_keys';
import { AddressItemsRecord } from '../store/slices/address_info';

import TrxLogo from '../popup/common/images/icon-trx-logo.svg';

class ResourceManager {
  resourceInfo: any;

  constructor() {
    this.resourceInfo = {};
  }

  static #instance: ResourceManager;

  public static getInstance(): ResourceManager {
    if (!ResourceManager.#instance) {
      ResourceManager.#instance = new ResourceManager();
    }

    return ResourceManager.#instance;
  }

  // init from chromeStorage when page loaded at first
  async getResourceInfoFromStorage() {
    if (Object.keys(this.resourceInfo).length === 0) {
      this.resourceInfo = (await chromeStorage.getItem(RESOURCE_INFO)) || {};
    }
  }

  async setNewAssetList(selectedAddress: string, selectedNode: string, saveNow = true) {
    const res = await fetchNewAssetList(selectedAddress);
    if (res.success) {
      _.set(
        this.resourceInfo,
        [selectedAddress, 'newAsset', 'list'],
        [..._.get(res.data, 'token', [])],
      );
      _.set(this.resourceInfo, [selectedAddress, 'newAsset', 'nodeId'], selectedNode);
      _.set(
        this.resourceInfo,
        [selectedAddress, 'newCollection', 'list'],
        [..._.get(res.data, 'trc721Token', [])],
      );
      _.set(this.resourceInfo, [selectedAddress, 'newCollection', 'nodeId'], selectedNode);
      saveNow && (await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo));
    }
  }

  async setFollowedAssetList(selectedAddress: string, selectedNode: string, saveNow = true) {
    try {
      const res = await fetchFollowedAssetList(selectedAddress);
      if (res.success) {
        const followedAssetList = _.get(res.data, 'token', []);
        if (Number(followedAssetList[0]?.type === 0)) {
          followedAssetList[0].price = 1;
          followedAssetList[0].precision = 6;
          followedAssetList[0].name = 'TRX';
          followedAssetList[0].shortName = 'TRX';
          followedAssetList[0].logoUrl = TrxLogo;
        }
        _.set(
          this.resourceInfo,
          [selectedAddress, 'followedAsset', 'list'],
          [...followedAssetList],
        );
        _.set(this.resourceInfo, [selectedAddress, 'followedAsset', 'nodeId'], selectedNode);
        _.set(this.resourceInfo, [selectedAddress, 'prices'], {
          ...res.data.price,
        });

        _.set(
          this.resourceInfo,
          [selectedAddress, 'totalTRX', 'data', 'balance'],
          _.get(res, ['data', 'totalTRX'], 0),
        );
        _.set(
          this.resourceInfo,
          [selectedAddress, 'totalTRX', 'data', 'usdBalance'],
          _.get(res, ['data', 'totalUsd'], 0),
        );
        _.set(
          this.resourceInfo,
          [selectedAddress, 'totalTRX', 'data', 'cnyBalance'],
          _.get(res, ['data', 'totalCny'], 0),
        );
        _.set(this.resourceInfo, [selectedAddress, 'totalTRX', 'nodeId'], selectedNode);

        const prices = res?.data?.price;
        const priceList: PriceInfoType = { CNY: 0, USD: 0 };
        priceList.CNY = prices?.priceCny;
        priceList.USD = prices?.priceUSD;

        // _.set(this.resourceInfo, [selectedAddress, 'nodeId'], selectedNode);
        saveNow && (await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo));
        await getStore().dispatch(updatePrices({ priceList }));
      }
    } catch (error) {
      log.info('setFollowedAssetList: ', error);
    }
  }

  async setUnFollowedAssetList(selectedAddress: string, selectedNode: string, saveNow = true) {
    const res = await fetchUnFollowedAssetList(selectedAddress);
    if (res.success) {
      _.set(
        this.resourceInfo,
        [selectedAddress, 'unFollowedAsset', 'list'],
        [..._.get(res.data, 'token', [])],
      );
      _.set(this.resourceInfo, [selectedAddress, 'unFollowedAsset', 'nodeId'], selectedNode);
      // _.set(this.resourceInfo, [selectedAddress, 'nodeId'], selectedNode);
      saveNow && (await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo));
    }
  }

  async setFollowedCollectionList(selectedAddress: string, selectedNode: string, saveNow = true) {
    const res = await fetchFollowedCollectionList(selectedAddress);
    if (res.success) {
      _.set(
        this.resourceInfo,
        [selectedAddress, 'followedCollection', 'list'],
        [..._.get(res, 'data', [])],
      );
      _.set(this.resourceInfo, [selectedAddress, 'followedCollection', 'nodeId'], selectedNode);
      // _.set(this.resourceInfo, [selectedAddress, 'nodeId'], selectedNode);
      saveNow && (await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo));
    }
  }

  async setUnFollowedCollectionList(selectedAddress: string, selectedNode: string, saveNow = true) {
    const res = await fetchUnFollowedCollectionList(selectedAddress);
    if (res.success) {
      _.set(
        this.resourceInfo,
        [selectedAddress, 'unFollowedCollection', 'list'],
        [..._.get(res, ['data', 'token'], [])],
      );
      _.set(this.resourceInfo, [selectedAddress, 'unFollowedCollection', 'nodeId'], selectedNode);
      saveNow && (await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo));
    }
  }

  async getNewAssetList(selectedAddress: string, selectedNode: string): Promise<AssetType> {
    const { list = [], nodeId } = _.get(this.resourceInfo, [selectedAddress, 'newAsset'], {});
    if (nodeId === selectedNode) {
      return [...list];
    }
    await this.setNewAssetList(selectedAddress, selectedNode);
    const newNodeId = _.get(this.resourceInfo, [selectedAddress, 'newAsset', 'nodeId'], '');

    if (newNodeId === selectedNode) {
      return _.get(this.resourceInfo, [selectedAddress, 'newAsset', 'list'], []);
    }
    return [];
  }

  async getNewCollectionList(selectedAddress: string, selectedNode: string): Promise<AssetType> {
    const { list = [], nodeId } = _.get(this.resourceInfo, [selectedAddress, 'newCollection'], {});
    if (nodeId === selectedNode) {
      return [...list];
    }
    await this.setNewAssetList(selectedAddress, selectedNode);
    const newNodeId = _.get(this.resourceInfo, [selectedAddress, 'newAsset', 'nodeId']);

    if (newNodeId === selectedNode) {
      return _.get(this.resourceInfo, [selectedAddress, 'newCollection', 'list']);
    }
    return [];
  }

  async getFollowedAssetList(selectedAddress: string, selectedNode: string): Promise<AssetType> {
    const { list = [], nodeId } = _.get(this.resourceInfo, [selectedAddress, 'followedAsset'], {});
    if (nodeId === selectedNode) {
      return [...list];
    }
    await this.setFollowedAssetList(selectedAddress, selectedNode);
    const newNodeId = _.get(this.resourceInfo, [selectedAddress, 'followedAsset', 'nodeId']);

    if (newNodeId === selectedNode) {
      return _.get(this.resourceInfo, [selectedAddress, 'followedAsset', 'list'], []);
    }
    return [];
  }

  async getUnFollowedAssetList(selectedAddress: string, selectedNode: string): Promise<AssetType> {
    const { list = [], nodeId } = _.get(
      this.resourceInfo,
      [selectedAddress, 'unFollowedAsset'],
      {},
    );
    if (nodeId === selectedNode) {
      return [...list];
    }
    await this.setUnFollowedAssetList(selectedAddress, selectedNode);
    const newNodeId = _.get(this.resourceInfo, [selectedAddress, 'unFollowedAsset', 'nodeId'], {});

    if (newNodeId === selectedNode) {
      return _.get(this.resourceInfo, [selectedAddress, 'unFollowedAsset', 'list'], []);
    }
    return [];
  }

  async getFollowedCollectionList(
    selectedAddress: string,
    selectedNode: string,
  ): Promise<AssetType> {
    const { list = [], nodeId } = _.get(
      this.resourceInfo,
      [selectedAddress, 'followedCollection'],
      {},
    );
    if (nodeId === selectedNode) {
      return [...list];
    }
    await this.setFollowedCollectionList(selectedAddress, selectedNode);
    const newNodeId = _.get(this.resourceInfo, [selectedAddress, 'followedCollection', 'nodeId']);

    if (newNodeId === selectedNode) {
      return _.get(this.resourceInfo, [selectedAddress, 'followedCollection', 'list']);
    }
    return [];
  }

  async getUnFollowedCollectionList(
    selectedAddress: string,
    selectedNode: string,
  ): Promise<AssetType> {
    const { list = [], nodeId } = _.get(
      this.resourceInfo,
      [selectedAddress, 'unFollowedCollection'],
      {},
    );
    if (nodeId === selectedNode) {
      return [...list];
    }
    await this.setUnFollowedCollectionList(selectedAddress, selectedNode);
    const newNodeId = _.get(this.resourceInfo, [selectedAddress, 'unFollowedCollection', 'nodeId']);

    if (newNodeId === selectedNode) {
      return _.get(this.resourceInfo, [selectedAddress, 'unFollowedCollection', 'list'], []);
    }
    return [];
  }

  async setAccountsTotalTrx(
    selectedAddress: string,
    addressItems: AddressItemsRecord,
    selectedNode: string,
    saveNow = true,
  ) {
    try {
      const addressArr = [];
      for (const id in addressItems) {
        if (selectedAddress != id) {
          addressArr.push({ [id]: 1 });
        }
      }
      const res = await fetchAccountsTotalTrx(selectedAddress, addressArr);
      if (res.success) {
        const balanceList = res.data?.balanceList || [];
        balanceList.forEach(
          (item: { address: string; balance: number; usdBalance: number; cnyBalance: number }) => {
            const { address, balance, usdBalance, cnyBalance } = item;
            _.set(this.resourceInfo, [address, 'totalTRX', 'data', 'balance'], balance || 0);
            _.set(this.resourceInfo, [address, 'totalTRX', 'data', 'usdBalance'], usdBalance || 0);
            _.set(this.resourceInfo, [address, 'totalTRX', 'data', 'cnyBalance'], cnyBalance || 0);
            _.set(this.resourceInfo, [address, 'totalTRX', 'nodeId'], selectedNode);
          },
        );
        saveNow && (await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo));
      }
    } catch (error) {
      log.info('setAccountsTotalTrx error: ', error);
    }
  }

  async getCurrentAddressTotalTrx(
    address: string,
    selectedNode: string,
    addressItems: AddressItemsRecord,
  ) {
    const { data = 0, nodeId } = _.get(this.resourceInfo, [address, 'totalTRX'], {});
    if (nodeId === selectedNode) {
      return data;
    }
    await this.setAccountsTotalTrx(address, addressItems, selectedNode);
    const newNodeId = _.get(this.resourceInfo, [address, 'totalTRX', 'nodeId']);

    if (newNodeId === selectedNode) {
      return _.get(this.resourceInfo, [address, 'totalTRX', 'data']);
    }
  }

  async setAllAssetList(selectedAddress: string, selectedNode: string, saveNow = true) {
    await this.setFollowedAssetList(selectedAddress, selectedNode, false);
    await this.setUnFollowedAssetList(selectedAddress, selectedNode, false);
    await this.setFollowedCollectionList(selectedAddress, selectedNode, false);
    await this.setUnFollowedCollectionList(selectedAddress, selectedNode, false);
    await this.setNewAssetList(selectedAddress, selectedNode, false);
    // this.setAccountsTotalTrx(
    //   selectedAddress,
    //   getStore().getState().addressInfo.addressItems,
    //   false,
    // );
    // _.set(this.resourceInfo, [selectedAddress, 'nodeId'], selectedNode);
    saveNow && (await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo));
  }

  async getAllAssetList(
    selectedAddress: string,
    selectedNode: string,
  ): Promise<AllLocalTokensType> {
    try {
      const followedAsset = await this.getFollowedAssetList(selectedAddress, selectedNode);
      const unFollowedAsset = await this.getUnFollowedAssetList(selectedAddress, selectedNode);
      const followedCollection = await this.getFollowedCollectionList(
        selectedAddress,
        selectedNode,
      );
      const unFollowedCollection = await this.getUnFollowedCollectionList(
        selectedAddress,
        selectedNode,
      );
      const newAsset = await this.getNewAssetList(selectedAddress, selectedNode);
      const newCollection = await this.getNewCollectionList(selectedAddress, selectedNode);
      return {
        followedAsset,
        followedCollection,
        unFollowedAsset,
        unFollowedCollection,
        newAsset,
        newCollection,
      };
    } catch (error) {
      log.info('getAllAssetList error: ', error);
      return {};
    }
  }

  async setSortType(selectedAddress: string, selectedNode: string, value: number) {
    try {
      _.set(this.resourceInfo, [selectedAddress, 'nodes', selectedNode, 'sortType'], value);
      await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo);
    } catch (error) {
      log.info('setSortType: ', error);
    }
  }

  async setHideSmallWorthAsset(selectedAddress: string, selectedNode: string, value: boolean) {
    try {
      _.set(
        this.resourceInfo,
        [selectedAddress, 'nodes', selectedNode, 'hideSmallWorthAsset'],
        value,
      );
      await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo);
    } catch (error) {
      log.info('setHideSmallWorthAsset: ', error);
    }
  }

  async setHotTokens(selectedAddress: string, selectedNode: string) {
    try {
      const res = await getHotTokens(selectedAddress);
      if (res.success) {
        _.set(
          this.resourceInfo,
          [selectedAddress, 'nodes', selectedNode, 'hotTokens'],
          [..._.get(res.data, 'token', [])],
        );

        await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo);
      }
    } catch (error) {
      log.info('setHotTokens: ', error);
    }
  }

  async setEnergyInfo(
    tronWebInstance: any,
    selectedNode: string,
    selectedAddress: string,
    saveNow = true,
  ) {
    try {
      const res = await getAccountResourcesByAddress(tronWebInstance, selectedAddress);
      if (res.success) {
        _.set(this.resourceInfo, [selectedAddress, 'nodes', selectedNode, 'energyInfo'], {
          ..._.get(res, 'data', {}),
        });

        saveNow && (await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo));
      }
    } catch (error) {
      log.info('setAccountResources: ', error);
    }
  }

  async setSortManualAsset(
    sorttedManulTokens: AssetType,
    selectedAddress: string,
    selectedNode: string,
    assetType: 1 | 2 = 1,
  ) {
    try {
      if (sorttedManulTokens.length) {
        const tokenIds: Array<string> = [];
        sorttedManulTokens.forEach((token) => {
          tokenIds.push(getTokenId(token));
        });
        _.set(
          this.resourceInfo,
          [
            selectedAddress,
            'nodes',
            selectedNode,
            assetType === 1 ? 'sortManualAsset' : 'sortManualCollection',
          ],
          tokenIds,
        );

        await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo);
      }
    } catch (error) {
      log.info('setSortManualAsset: ', error);
    }
  }

  async fetchIntervalResourceInfo(tronWebInstance: any) {
    const rootState = getStore().getState();
    const selectedAddress = rootState.addressInfo.selectedAddress;
    const addressItems = rootState.addressInfo.addressItems;
    const selectedNode = rootState.nodeManagement.selectedNode;
    // @ts-ignore
    await this.setAccountsTotalTrx(selectedAddress, addressItems, selectedNode, false);
    await this.setEnergyInfo(tronWebInstance, selectedNode, selectedAddress, false);
    await this.setAllAssetList(selectedAddress, selectedNode);
  }

  async deleteAddressResourceInfo(address: string) {
    try {
      _.unset(this.resourceInfo, address);
      await chromeStorage.setItem(RESOURCE_INFO, this.resourceInfo);
    } catch (error) {
      log.info(error);
    }
  }
}

export const resourceManager = ResourceManager.getInstance();
