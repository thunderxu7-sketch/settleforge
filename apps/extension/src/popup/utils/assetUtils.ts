import _ from 'lodash';
import log from 'loglevel';
// import BigNumber from 'bignumber.js';
import { BigNumber } from './numberUtils';

import { AssetType, AssetItemType } from '../../constants/types';
import { NOT_SUPPORT_MAPPER } from '../../constants/common';
import { PricesType } from './../../hooks/prices_info';
import { getCollectionList, getCollectionInfos } from '../../service/local_data_service';
import { CollectionType } from '../../constants/types';

export const isCustomToken = (tokenStatus: number) => {
  if ([1, 2].includes(tokenStatus)) {
    return true;
  }
  return false;
};

export const isTopAsset = (token: AssetItemType) => {
  try {
    const type = Number(token?.type);
    const top = Number(token?.top);
    return type === 0 || top === 2;
  } catch (e) {
    log.error('isTopAsset: ', e);
    return false;
  }
};

/**
 * sortType
 * 1 Prederence
 * 2 sort by value
 * 3 sort by name
 * */

const SORT_KEY_MAP: { [k: string]: number } = {
  '2': 1,
  '3': 2,
};

const SORT_KEY_MAP_TRC721: { [k: string]: number } = {
  '2': 3,
  '3': 4,
};

const itemBigNumberCompare = (v1: string | number, v2: string | number) => {
  if (new BigNumber(v1).gt(v2)) return 1;
  if (new BigNumber(v1).lt(v2)) return -1;
  return 0;
};

const itemCommonCompare = (v1: string, v2: string) => {
  if (v1 > v2) return 1;
  if (v1 < v2) return -1;
  return 0;
};

const COMPARE_FUNCTIONS: { [k: string]: (a: AssetItemType, b: AssetItemType) => number } = {
  top: function (a, b) {
    return itemBigNumberCompare(a.top, b.top);
  },
  trxCount: function (a, b) {
    return itemBigNumberCompare(a.trxCount, b.trxCount);
  },
  price: function (a, b) {
    return itemBigNumberCompare(a.price, b.price);
  },
  balanceStr: function (a, b) {
    return itemBigNumberCompare(a.balanceStr, b.balanceStr);
  },
  shortName: function (a, b) {
    return itemCommonCompare(_.toUpper(a.shortName), _.toUpper(b.shortName));
  },
  id: function (a, b) {
    return itemCommonCompare(a.id, b.id);
  },
  contractAddress: function (a, b) {
    return itemCommonCompare(_.toUpper(a.contractAddress), _.toUpper(b.contractAddress));
  },
  isOfficial: function (a, b) {
    return itemBigNumberCompare(a.isOfficial, b.isOfficial);
  },
  count: function (a, b) {
    return itemBigNumberCompare(a.count, b.count);
  },
};

const sortFunc = (a: AssetItemType, b: AssetItemType, sortKeys: string[], sortValues: string[]) => {
  let i = 0;
  const len = sortKeys.length;
  while (i <= len - 1) {
    const keyStr = sortKeys[i];
    const valueStr = sortValues[i];
    const func = COMPARE_FUNCTIONS[keyStr];
    let res;
    if (valueStr === 'asc') {
      res = func(a, b);
    } else {
      res = func(b, a);
    }
    if (res != 0) return res;
    i++;
  }
  return 0;
};
/*
 * common: 1 by price  2 by name
 * 721sort:  3 amount 4 by name
 * top tokens should not be sorted by rules, just reserve the order in the tokens fetched from the local data provider
 */
export const sortToken = (tokens: AssetType, type = 1, isTRC721 = false) => {
  try {
    if (isTRC721) {
      type = SORT_KEY_MAP_TRC721[String(type)];
    } else {
      type = SORT_KEY_MAP[String(type)];
    }

    let sortKeys: Array<string> = [];
    let sortValues: Array<string> = [];
    switch (type) {
      case 1:
        sortKeys = ['trxCount', 'price', 'balanceStr', 'shortName', 'id', 'contractAddress'];
        sortValues = ['desc', 'desc', 'desc', 'asc', 'asc', 'asc'];
        break;
      case 2:
        sortKeys = ['shortName', 'id', 'contractAddress'];
        sortValues = ['asc', 'asc', 'asc'];
        break;
      case 3:
        sortKeys = ['count', 'shortName', 'contractAddress'];
        sortValues = ['desc', 'asc', 'asc'];
        break;
      case 4:
        sortKeys = ['shortName', 'contractAddress'];
        sortValues = ['asc', 'asc'];
        break;
      default:
        sortKeys = [];
        sortValues = [];
    }
    const commonTokens: Array<any> = [];
    const topTokens: Array<any> = [];

    tokens.forEach((item) => {
      if (isTopAsset(item)) {
        topTokens.push(item);
      } else {
        commonTokens.push(item);
      }
    });
    const sortedCommonTokens = commonTokens.sort((a, b) => {
      return sortFunc(a, b, sortKeys, sortValues);
    });

    const sortedTokens = _.concat(topTokens, sortedCommonTokens);
    return sortedTokens;
  } catch (e) {
    log.error(e);
    return tokens;
  }
};

export const sortTokenManual = (tokens: AssetType = [], sortManualTokens: Array<string> = []) => {
  try {
    if (!sortManualTokens || sortManualTokens.length === 0) return tokens;

    const topTokens: AssetItemType[] = [];
    const newSortManualTokens: AssetItemType[] = [];
    const tokensMap: { [key: string]: AssetItemType } = {};

    tokens.forEach((token, index) => {
      if (Number(token?.top) === 5) {
        topTokens.push(token);
      } else {
        const tokenId = getTokenId(token);
        tokensMap[tokenId] = { ...token, originIndex: index };
      }
    });
    sortManualTokens.forEach((id: string) => {
      if (tokensMap[id]) {
        newSortManualTokens.push({ ...tokensMap[id] });
        delete tokensMap[id];
      }
    });
    const restTokens = Object.values(tokensMap);
    const sorttedRestTokens = _.orderBy(restTokens, ['originIndex'], ['asc']);
    return topTokens.concat(newSortManualTokens, sorttedRestTokens);
  } catch (e) {
    log.error('sortTokenManual: ', e);
    return tokens;
  }
};

export const hideZeroToken = (tokens: AssetType, pricesInfo: PricesType) => {
  try {
    const filterTokens = tokens.filter((item: AssetItemType) => {
      if (isTopAsset(item)) {
        return item;
      }
      const usdPrice = pricesInfo?.priceList?.USD || 0;

      const balance = new BigNumber(item?.trxCount).times(usdPrice);
      return new BigNumber(balance).gte(1);
    });
    return filterTokens;
  } catch (e) {
    return tokens;
  }
};

export const hideZeroTokenTRC721 = (tokens: AssetType) => {
  try {
    const filterTokens = tokens.filter((item: AssetItemType) => {
      if (isTopAsset(item)) {
        return item;
      }
      return new BigNumber(item?.count).gt(0);
    });
    return filterTokens;
  } catch (e) {
    return tokens;
  }
};

export const getAccountResourcesByAddress = async (
  tronWebInstance: any,
  selectedAddress: string,
) => {
  try {
    const {
      EnergyLimit = 0,
      EnergyUsed = 0,
      freeNetLimit = 0,
      NetLimit = 0,
      freeNetUsed = 0,
      NetUsed = 0,
      TotalEnergyWeight,
      TotalEnergyLimit,
    } = await tronWebInstance.trx.getAccountResources(selectedAddress);
    return {
      success: true,
      data: {
        energy: EnergyLimit,
        energyUsed: EnergyUsed,
        netLimit: freeNetLimit + NetLimit,
        NetUsedOnly: NetUsed,
        netUsed: NetUsed + freeNetUsed,
        totalEnergyWeight: TotalEnergyWeight,
        totalEnergyLimit: TotalEnergyLimit,
        freeNetLimit: freeNetLimit,
      },
    };
  } catch (e) {
    log.error('getAccountResources: ', e);
    return {
      success: false,
      data: {
        energy: 0,
        energyUsed: 0,
        netLimit: 0,
        NetUsedOnly: 0,
        netUsed: 0,
        totalEnergyWeight: 0,
        totalEnergyLimit: 0,
        freeNetLimit: 0,
      },
    };
  }
};

export const checkAddressActive = async (tronWebInstance: any, selectedAddress: string) => {
  try {
    const account = await tronWebInstance.trx.getAccount(selectedAddress);
    if (account?.address) {
      return true;
    }
    return false;
  } catch (e) {
    log.error('checkAddressActive: ', e);
    return false;
  }
};

/*
 * 0 common
 * 1 official
 * -4 risk
 * -5 cheat
 */
export const isRiskAsset = (token: AssetItemType) => {
  try {
    const isOfficial = Number(token?.isOfficial);
    return isOfficial === -4 || isOfficial === -5;
  } catch (e) {
    log.error('isRiskAsset: ', e);
    return false;
  }
};

export const getTokenId = (token: AssetItemType) => {
  try {
    const type = token?.type;
    if (type === 0) {
      return '_'; //trx
    }
    if (type === 1) {
      return token?.id;
    }
    return token?.contractAddress;
  } catch (e) {
    log.error('getTokenId: ', e);
    return '';
  }
};

export const filterTronLinkNoFunctions = (noFunctions: string[], type: number) => {
  return noFunctions
    .map((functionId: string) => {
      let formatFunctionId = functionId.toLowerCase();
      if (type === 5) {
        formatFunctionId = 'trc721.' + formatFunctionId;
      }
      return formatFunctionId;
    })
    .filter((formatFunctionId: string) => {
      return !!NOT_SUPPORT_MAPPER[formatFunctionId];
    });
};

export const getCollectionListInfo = async (
  address: string,
  tokenAddress: string,
  pageIndex: number = 1,
  pageSize: number = 20,
) => {
  try {
    const result = await getCollectionList(address, tokenAddress, pageIndex, pageSize);
    const collectionInfoList = _.get(result, 'data.collectionInfoList');
    if (_.size(collectionInfoList) > 0) {
      let assetIdList = [];
      const assetInfo: { [k: string]: CollectionType } = {};
      for (let index = 0; index < collectionInfoList.length; index++) {
        const item = collectionInfoList[index] || {};
        if (!item.name && !item.intro) {
          assetIdList.push(item.assetId);
        }
        if (assetIdList.length === 10 || index === collectionInfoList.length - 1) {
          const assetResult = await getCollectionInfos(address, tokenAddress, assetIdList);
          const assetList = _.get(assetResult, 'data');

          Object.assign(assetInfo, _.keyBy(assetList, 'assetId'));
          assetIdList = [];
        }
      }

      collectionInfoList.forEach((item: CollectionType) => {
        if (!item.name && !item.intro) {
          Object.assign(item, assetInfo[item.assetId]);
        }
      });
    }
    return result;
  } catch (error) {
    log.error('getCollectionList:', error);
    return {
      success: false,
    };
  }
};
