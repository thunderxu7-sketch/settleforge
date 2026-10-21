import BigNumber from 'bignumber.js';
import _ from 'lodash';
import log from 'loglevel';
// @ts-ignore
import TronWeb from 'tronweb';

import { AssetItemType, AssetType, CollectionType } from '../constants/types';
import { RESOURCE_INFO } from '../constants/storage_keys';
import { chromeStorage } from '../lib/storage';
import { getStore, RootState } from '../store/store';
import { NODE_ID_NILE, TRON_NODES } from '../constants/tron_nodes';

export interface ApiResponse {
  success: boolean;
  data: any;
  error?: string;
}

type ResourceInfo = Record<string, any>;

type NodeInfo = {
  fullNode?: string;
  solidityNode?: string;
  eventServer?: string;
  headers?: Record<string, string>;
  apiConfig?: Record<string, any>;
  netType?: number;
  chain?: string;
  hostname?: string;
};

const DEFAULT_ERROR = 'LOCAL_DATA_UNAVAILABLE';

const toBNString = (value: any): string => {
  if (value === undefined || value === null || value === '') {
    return '0';
  }

  if (Array.isArray(value)) {
    return toBNString(value[0]);
  }

  if (typeof value === 'object') {
    if (value._hex) {
      return new BigNumber(value._hex).toFixed();
    }
    if (value.hex) {
      return new BigNumber(value.hex).toFixed();
    }
    if (value.toString) {
      return value.toString();
    }
  }

  return `${value}`;
};

const fromSun = (value: any, precision = 6) => {
  return new BigNumber(toBNString(value)).shiftedBy(-precision).toFixed();
};

const normalizeContractString = (value: any): string => {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return normalizeContractString(value[0]);
  if (typeof value === 'object' && value.toString) return value.toString();
  if (typeof value !== 'string') return `${value}`;

  // Some contracts return bytes32. TronWeb usually decodes strings, but keep a safe fallback.
  if (/^0x[0-9a-fA-F]+$/.test(value)) {
    try {
      return TronWeb.toUtf8(value).replace(/\u0000/g, '').trim();
    } catch (e) {
      return value;
    }
  }

  return value;
};

const normalizeAddress = (address: string) => {
  try {
    if (!address) return address;
    if (address.match(/^41[0-9a-fA-F]{40}$/)) {
      return TronWeb.address.fromHex(address);
    }
    return address;
  } catch (e) {
    return address;
  }
};

export const accountToHex = (address: string) => {
  if (address && address.match(/^T/)) {
    return TronWeb.address.toHex(address).toUpperCase();
  }
  return address;
};

export const getCurrentNode = (): NodeInfo => {
  try {
    const rootState: RootState = getStore().getState();
    const selectedNode = rootState.nodeManagement.selectedNode;
    const nodeList = { ...TRON_NODES, ...rootState.nodeManagement.nodeList } as Record<string, any>;
    const defaultNodes = TRON_NODES as Record<string, any>;
    return nodeList[selectedNode] || defaultNodes[Object.keys(defaultNodes)[0]] || {};
  } catch (e) {
    const defaultNodes = TRON_NODES as Record<string, any>;
    return defaultNodes[Object.keys(defaultNodes)[0]] || {};
  }
};

const getSelectedNodeId = () => {
  try {
    return getStore().getState().nodeManagement.selectedNode;
  } catch (e) {
    return '';
  }
};

const getTronWeb = (nodeInfo?: NodeInfo) => {
  const node = nodeInfo || getCurrentNode();
  return new TronWeb({
    fullNode: node.fullNode,
    solidityNode: node.solidityNode || node.fullNode,
    eventServer: node.eventServer || node.fullNode,
    headers: node.headers,
    privateKey: '01',
  });
};

const getResourceInfo = async (): Promise<ResourceInfo> => {
  return (await chromeStorage.getItem<ResourceInfo>(RESOURCE_INFO)) || {};
};

const setResourceInfo = async (resourceInfo: ResourceInfo) => {
  await chromeStorage.setItem(RESOURCE_INFO, resourceInfo);
};

const tokenKey = (token: Partial<AssetItemType>) => {
  const type = Number(token.type);
  if (type === 0) return '_';
  if (type === 1) return `${token.id || ''}`;
  return `${token.contractAddress || ''}`;
};

const isSameToken = (token: Partial<AssetItemType>, id: string, type?: number) => {
  const candidateType = Number(token.type);
  if (type !== undefined && candidateType !== Number(type)) return false;
  if (candidateType === 1) return `${token.id}` === `${id}`;
  if (candidateType === 2 || candidateType === 5) return `${token.contractAddress}` === `${id}`;
  return id === '_' || id === '';
};

const buildBaseAsset = (input: Partial<AssetItemType> = {}): AssetItemType => {
  const type = Number(input.type ?? 2);
  const precision = Number(input.precision ?? 0);
  const rawBalance = input.balance ?? 0;
  const balanceStr = input.balanceStr ?? fromSun(rawBalance, precision);
  const shortName = input.shortName || input.name || '';
  const name = input.name || shortName;
  return {
    balance: Number(rawBalance) || 0,
    balanceStr,
    contractAddress: input.contractAddress || '',
    homePage: input.homePage || '',
    id: input.id || '',
    inMainChain: input.inMainChain ?? true,
    inSideChain: input.inSideChain ?? false,
    isInAssets: input.isInAssets ?? true,
    isOfficial: input.isOfficial ?? 0,
    isShield: input.isShield ?? false,
    issueAddress: input.issueAddress || '',
    issueTime: input.issueTime || '',
    logoUrl: input.logoUrl || '',
    maincontractAddress: input.maincontractAddress || '',
    marketId: input.marketId || 0,
    name,
    precision,
    price: input.price ?? 0,
    recommandSortId: input.recommandSortId || 0,
    shortName,
    tokenDesc: input.tokenDesc || '',
    tokenStatus: input.tokenStatus ?? (type === 2 || type === 5 ? 1 : 0),
    top: input.top ?? (type === 0 ? 2 : 0),
    totalBalance: input.totalBalance ?? (Number(rawBalance) || 0),
    totalSupply: input.totalSupply ?? 0,
    totalSupplyStr: input.totalSupplyStr || '',
    transferStatus: input.transferStatus ?? true,
    trxCount: input.trxCount ?? (Number(balanceStr) || 0),
    type,
    usdPrice: input.usdPrice || '0',
    usdCount: input.usdCount || 0,
    cnyPrice: input.cnyPrice || '0',
    cnyCount: input.cnyCount || 0,
    count: input.count ?? 0,
    nrOfTokenHolders: input.nrOfTokenHolders || 0,
    transferCount: input.transferCount || 0,
  } as AssetItemType;
};

const buildTrxAsset = async (address: string, nodeInfo?: NodeInfo): Promise<AssetItemType> => {
  let balance = '0';
  try {
    const tronWeb = getTronWeb(nodeInfo);
    balance = toBNString(await tronWeb.trx.getUnconfirmedBalance(address));
  } catch (e) {
    log.info('buildTrxAsset balance unavailable:', e);
  }

  return buildBaseAsset({
    type: 0,
    id: '_',
    name: 'TRX',
    shortName: 'TRX',
    precision: 6,
    balance: Number(balance) || 0,
    balanceStr: fromSun(balance, 6),
    trxCount: Number(fromSun(balance, 6)) || 0,
    totalBalance: Number(balance) || 0,
    tokenStatus: 0,
    isOfficial: 1,
    isInAssets: true,
    transferStatus: true,
    top: 2,
    price: 0,
  });
};

const buildTrc10Asset = async (
  ownerAddress: string,
  tokenId: string,
  balanceValue?: any,
  nodeInfo?: NodeInfo,
): Promise<AssetItemType | undefined> => {
  try {
    const tronWeb = getTronWeb(nodeInfo);
    const tokenInfo = await tronWeb.trx.getTokenByID(tokenId);
    if (!tokenInfo) return undefined;
    const precision = Number(tokenInfo.precision || 0);
    let balance = balanceValue;
    if (balance === undefined) {
      const account = await tronWeb.trx.getUnconfirmedAccount(ownerAddress);
      const assetList = account?.assetV2 || account?.asset || [];
      const asset = assetList.find((item: any) => `${item.key}` === `${tokenId}`);
      balance = asset?.value || 0;
    }
    const name = normalizeContractString(tokenInfo.name || tokenInfo.abbr || tokenId);
    const shortName = normalizeContractString(tokenInfo.abbr || tokenInfo.name || tokenId);

    return buildBaseAsset({
      type: 1,
      id: `${tokenId}`,
      name,
      shortName,
      precision,
      balance: Number(balance) || 0,
      balanceStr: fromSun(balance, precision),
      trxCount: Number(fromSun(balance, precision)) || 0,
      totalSupply: Number(tokenInfo.total_supply || tokenInfo.totalSupply || 0),
      totalSupplyStr: `${tokenInfo.total_supply || tokenInfo.totalSupply || 0}`,
      tokenStatus: 0,
      transferStatus: true,
      isInAssets: true,
    });
  } catch (e) {
    log.info('buildTrc10Asset unavailable:', e);
    return undefined;
  }
};

const callContractString = async (contract: any, method: string): Promise<string> => {
  try {
    if (!contract?.[method]) return '';
    return normalizeContractString(await contract[method]().call());
  } catch (e) {
    return '';
  }
};

const callContractNumber = async (contract: any, method: string, fallback = '0'): Promise<string> => {
  try {
    if (!contract?.[method]) return fallback;
    return toBNString(await contract[method]().call());
  } catch (e) {
    return fallback;
  }
};

const getContractBalance = async (contract: any, ownerAddress: string): Promise<string> => {
  try {
    if (!contract?.balanceOf) return '0';
    return toBNString(await contract.balanceOf(ownerAddress).call());
  } catch (e) {
    return '0';
  }
};

const buildContractAsset = async (
  ownerAddress: string,
  contractAddress: string,
  forcedType?: 2 | 5,
  overrides: Partial<AssetItemType> = {},
  nodeInfo?: NodeInfo,
): Promise<AssetItemType | undefined> => {
  try {
    const address = normalizeAddress(contractAddress);
    if (!TronWeb.isAddress(address)) return undefined;

    const tronWeb = getTronWeb(nodeInfo);
    const contract = await tronWeb.contract().at(address);
    const name = overrides.name || (await callContractString(contract, 'name')) || address;
    const shortName = overrides.shortName || (await callContractString(contract, 'symbol')) || name;
    const hasDecimals = !!contract?.decimals;
    const decimals = await callContractNumber(
      contract,
      'decimals',
      forcedType === 5 || !hasDecimals ? '0' : '6',
    );
    const precision = forcedType === 5 ? 0 : Number(decimals || overrides.precision || 0);
    const balance = await getContractBalance(contract, ownerAddress);
    const totalSupply = await callContractNumber(contract, 'totalSupply', '0');
    const type = forcedType || (hasDecimals ? 2 : 5);
    const balanceStr = type === 5 ? balance : fromSun(balance, precision);

    return buildBaseAsset({
      ...overrides,
      type,
      id: type === 5 ? address : overrides.id || '',
      contractAddress: address,
      name,
      shortName,
      precision,
      balance: Number(balance) || 0,
      balanceStr,
      count: type === 5 ? Number(balance) || 0 : overrides.count || 0,
      trxCount: type === 5 ? Number(balance) || 0 : Number(balanceStr) || 0,
      totalSupply: Number(totalSupply) || overrides.totalSupply || 0,
      totalSupplyStr: totalSupply || `${overrides.totalSupply || 0}`,
      tokenStatus: overrides.tokenStatus ?? 1,
      transferStatus: true,
      isInAssets: overrides.isInAssets ?? true,
    });
  } catch (e) {
    log.info('buildContractAsset unavailable:', e);
    return undefined;
  }
};

const hydrateToken = async (
  ownerAddress: string,
  token: Partial<AssetItemType>,
  nodeInfo?: NodeInfo,
): Promise<AssetItemType | undefined> => {
  const type = Number(token.type);
  try {
    if (type === 0) {
      return buildTrxAsset(ownerAddress, nodeInfo);
    }
    if (type === 1) {
      return (await buildTrc10Asset(ownerAddress, `${token.id}`, undefined, nodeInfo)) || buildBaseAsset(token);
    }
    if (type === 2 || type === 5) {
      return (
        (await buildContractAsset(
          ownerAddress,
          `${token.contractAddress}`,
          type as 2 | 5,
          token,
          nodeInfo,
        )) || buildBaseAsset(token)
      );
    }
  } catch (e) {
    log.info('hydrateToken error:', e);
  }
  return buildBaseAsset(token);
};

const uniqueTokens = (tokens: Array<Partial<AssetItemType>>) => {
  const seen = new Set<string>();
  return tokens.filter((token) => {
    const key = `${Number(token.type)}:${tokenKey(token)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }) as AssetType;
};

const getStoredFollowedAssets = (resourceInfo: ResourceInfo, address: string): AssetType => {
  return _.get(resourceInfo, [address, 'followedAsset', 'list'], []) || [];
};

const getStoredFollowedCollections = (resourceInfo: ResourceInfo, address: string): AssetType => {
  return _.get(resourceInfo, [address, 'followedCollection', 'list'], []) || [];
};

const collectAccountTrc10Assets = async (
  ownerAddress: string,
  nodeInfo?: NodeInfo,
): Promise<AssetType> => {
  try {
    const tronWeb = getTronWeb(nodeInfo);
    const account = await tronWeb.trx.getUnconfirmedAccount(ownerAddress);
    const assetList = account?.assetV2 || account?.asset || [];
    const assets = await Promise.all(
      assetList.map((item: any) => buildTrc10Asset(ownerAddress, `${item.key}`, item.value, nodeInfo)),
    );
    return assets.filter(Boolean) as AssetType;
  } catch (e) {
    log.info('collectAccountTrc10Assets unavailable:', e);
    return [];
  }
};

export const fetchNewAssetList = async (_address: string): Promise<ApiResponse> => ({
  success: true,
  data: { token: [], trc721Token: [] },
});

export const fetchFollowedAssetList = async (address: string): Promise<ApiResponse> => {
  try {
    const selectedNode = getSelectedNodeId();
    const nodeInfo = getCurrentNode();
    const resourceInfo = await getResourceInfo();
    const storedAssets = getStoredFollowedAssets(resourceInfo, address).filter(
      (token) => Number(token.type) !== 0 && Number(token.type) !== 5,
    );
    const trxAsset = await buildTrxAsset(address, nodeInfo);
    const trc10Assets = await collectAccountTrc10Assets(address, nodeInfo);
    const hydratedStoredAssets = (
      await Promise.all(storedAssets.map((token) => hydrateToken(address, token, nodeInfo)))
    ).filter(Boolean) as AssetType;
    const token = uniqueTokens([trxAsset, ...trc10Assets, ...hydratedStoredAssets]);

    _.set(resourceInfo, [address, 'followedAsset', 'list'], token);
    _.set(resourceInfo, [address, 'followedAsset', 'nodeId'], selectedNode);
    _.set(resourceInfo, [address, 'prices'], { priceCny: 0, priceUSD: 0 });
    await setResourceInfo(resourceInfo);

    return {
      success: true,
      data: {
        token,
        price: { priceCny: 0, priceUSD: 0 },
        totalTRX: trxAsset.trxCount || 0,
        totalUsd: 0,
        totalCny: 0,
      },
    };
  } catch (error) {
    log.error('fetchFollowedAssetList:', error);
    return { success: false, data: { token: [] }, error: DEFAULT_ERROR };
  }
};

export const fetchFollowedCollectionList = async (address: string): Promise<ApiResponse> => {
  try {
    const selectedNode = getSelectedNodeId();
    const nodeInfo = getCurrentNode();
    const resourceInfo = await getResourceInfo();
    const storedCollections = getStoredFollowedCollections(resourceInfo, address);
    const collections = (
      await Promise.all(
        storedCollections.map((token) => hydrateToken(address, { ...token, type: 5 }, nodeInfo)),
      )
    ).filter(Boolean) as AssetType;

    _.set(resourceInfo, [address, 'followedCollection', 'list'], collections);
    _.set(resourceInfo, [address, 'followedCollection', 'nodeId'], selectedNode);
    await setResourceInfo(resourceInfo);

    return { success: true, data: collections };
  } catch (error) {
    log.error('fetchFollowedCollectionList:', error);
    return { success: false, data: [], error: DEFAULT_ERROR };
  }
};

export const fetchUnFollowedAssetList = async (_address: string): Promise<ApiResponse> => ({
  success: true,
  data: { token: [] },
});

export const fetchUnFollowedCollectionList = async (_address: string): Promise<ApiResponse> => ({
  success: true,
  data: { token: [] },
});

const applyAssetOperation = async (
  address: string,
  params: Record<string, any>,
): Promise<{ changed: boolean }> => {
  const resourceInfo = await getResourceInfo();
  const selectedNode = getSelectedNodeId();
  const nodeInfo = getCurrentNode();
  let followedAssets: AssetItemType[] = getStoredFollowedAssets(resourceInfo, address).filter(
    (token) => Number(token.type) !== 0,
  );
  let followedCollections: AssetItemType[] = getStoredFollowedCollections(resourceInfo, address);
  let changed = false;

  const remove = (ids: string[], type: number) => {
    if (!ids.length) return;
    if (type === 5) {
      followedCollections = followedCollections.filter(
        (token) => !ids.some((id) => isSameToken(token, `${id}`, type)),
      );
    } else {
      followedAssets = followedAssets.filter((token) =>
        !ids.some((id) => isSameToken(token, `${id}`, type)),
      );
    }
    changed = true;
  };

  const add = async (ids: string[], type: 1 | 2 | 5) => {
    for (const id of ids) {
      const idStr = `${id}`;
      const exists = [...followedAssets, ...followedCollections].some((token) =>
        isSameToken(token, idStr, type),
      );
      if (exists) continue;

      let token: AssetItemType | undefined;
      if (type === 1) {
        token = await buildTrc10Asset(address, idStr, undefined, nodeInfo);
      } else {
        token = await buildContractAsset(address, idStr, type, {}, nodeInfo);
      }

      if (!token) {
        token = buildBaseAsset({
          type,
          id: type === 1 ? idStr : '',
          contractAddress: type === 1 ? '' : idStr,
          name: idStr,
          shortName: idStr,
          tokenStatus: type === 1 ? 0 : 1,
        });
      }

      if (type === 5) {
        followedCollections.push(token);
      } else {
        followedAssets.push(token);
      }
      changed = true;
    }
  };

  await add((params.token10 || []).map(String), 1);
  await add((params.token20 || []).map(String), 2);
  await add((params.token721 || []).map(String), 5);
  remove((params.token10Cancel || []).map(String), 1);
  remove((params.token20Cancel || []).map(String), 2);
  remove((params.token721Cancel || []).map(String), 5);

  followedAssets = uniqueTokens(followedAssets);
  followedCollections = uniqueTokens(followedCollections);

  _.set(resourceInfo, [address, 'followedAsset', 'list'], followedAssets);
  _.set(resourceInfo, [address, 'followedAsset', 'nodeId'], selectedNode);
  _.set(resourceInfo, [address, 'followedCollection', 'list'], followedCollections);
  _.set(resourceInfo, [address, 'followedCollection', 'nodeId'], selectedNode);
  await setResourceInfo(resourceInfo);

  return { changed };
};

export const addAsset = async (address: string, managerInfo = {}): Promise<ApiResponse> => {
  try {
    await applyAssetOperation(address, managerInfo as Record<string, any>);
    return { success: true, data: true };
  } catch (error) {
    log.error('addAsset:', error);
    return { success: false, data: false, error: DEFAULT_ERROR };
  }
};

export const queryCustomToken = async (
  address: string,
  contractAddress: string,
): Promise<ApiResponse> => {
  try {
    const normalizedAddress = normalizeAddress(contractAddress);
    if (!TronWeb.isAddress(normalizedAddress)) {
      return { success: true, data: { status: 1 } };
    }

    const resourceInfo = await getResourceInfo();
    const allStored = [
      ...getStoredFollowedAssets(resourceInfo, address),
      ...getStoredFollowedCollections(resourceInfo, address),
    ];
    const existing = allStored.find((token) => `${token.contractAddress}` === normalizedAddress);
    const assetInfo =
      (await buildContractAsset(address, normalizedAddress, undefined, existing || {})) || existing;

    if (!assetInfo) {
      return { success: true, data: { status: 2, balanceFunction: false, transferEvent: false } };
    }

    return {
      success: true,
      data: {
        status: existing ? 4 : 0,
        assetInfo: {
          ...assetInfo,
          usdPrice: '0',
          usdCount: 0,
          cnyPrice: '0',
          cnyCount: 0,
        },
        noFunctions: '',
        balanceFunction: true,
        transferEvent: true,
      },
    };
  } catch (error) {
    log.error('queryCustomToken:', error);
    return { success: false, data: { status: 2 }, error: DEFAULT_ERROR };
  }
};

export const addCustomToken = async (
  address: string,
  name: any,
  symbol: any,
  tokenAddress: any,
  type: any,
  decimal: any,
): Promise<ApiResponse> => {
  try {
    const token =
      (await buildContractAsset(
        address,
        tokenAddress,
        Number(type) === 5 ? 5 : 2,
        {
          name,
          shortName: symbol,
          precision: Number(decimal) || 0,
          tokenStatus: 1,
          isInAssets: true,
        },
      )) ||
      buildBaseAsset({
        type: Number(type) === 5 ? 5 : 2,
        name,
        shortName: symbol,
        contractAddress: tokenAddress,
        precision: Number(decimal) || 0,
        tokenStatus: 1,
      });

    const params = Number(token.type) === 5 ? { token721: [token.contractAddress] } : { token20: [token.contractAddress] };
    await applyAssetOperation(address, params);

    // Preserve user-edited metadata after the operation refreshes the list.
    const resourceInfo = await getResourceInfo();
    const listPath = Number(token.type) === 5 ? [address, 'followedCollection', 'list'] : [address, 'followedAsset', 'list'];
    const list = (_.get(resourceInfo, listPath, []) || []).map((item: AssetItemType) =>
      isSameToken(item, token.contractAddress, Number(token.type)) ? { ...item, ...token } : item,
    );
    _.set(resourceInfo, listPath, list);
    await setResourceInfo(resourceInfo);

    return { success: true, data: true };
  } catch (error) {
    log.error('addCustomToken:', error);
    return { success: false, data: false, error: DEFAULT_ERROR };
  }
};

export const getRiskTokens = async (_address: string): Promise<ApiResponse> => ({
  success: true,
  data: [],
});

export const getHotTokens = async (_address: string): Promise<ApiResponse> => ({
  success: true,
  data: [],
});

export const getCollectionList = async (
  _address: string,
  _tokenAddress: string,
  _pageIndex: number = 1,
  _pageSize: number = 20,
): Promise<ApiResponse> => ({
  success: true,
  data: { collectionInfoList: [] },
});

export async function getCollectionInfos(
  _address: string,
  _tokenAddress: string,
  _assetIdList: string[] = [],
): Promise<ApiResponse> {
  return { success: true, data: [] };
}

export const searchCollectionListByKeyWords = async (
  _address: string,
  _tokenAddress: string,
  _word: string,
): Promise<ApiResponse> => ({
  success: true,
  data: { collectionInfoList: [] },
});

const matchesSearch = (token: AssetItemType, keyWord: string, type = 0) => {
  const normalizedKey = keyWord.trim().toLowerCase();
  if (!normalizedKey) return true;
  if (type && Number(token.type) !== Number(type)) return false;
  const fields = [token.id, token.contractAddress, token.name, token.shortName]
    .filter(Boolean)
    .map((item) => `${item}`.toLowerCase());
  return fields.some((field) => field.includes(normalizedKey));
};

export async function searchTokens(
  address: string,
  keyWord: string,
  _page = 1,
  count = 20,
  type = 0,
): Promise<ApiResponse> {
  try {
    const nodeInfo = getCurrentNode();
    const resourceInfo = await getResourceInfo();
    const storedTokens = uniqueTokens([
      ...getStoredFollowedAssets(resourceInfo, address),
      ...getStoredFollowedCollections(resourceInfo, address),
    ]);
    const hydratedStoredTokens = (
      await Promise.all(storedTokens.map((token) => hydrateToken(address, token, nodeInfo)))
    ).filter(Boolean) as AssetType;
    const trxAsset = await buildTrxAsset(address, nodeInfo);
    const trc10Assets = await collectAccountTrc10Assets(address, nodeInfo);
    const candidates: AssetItemType[] = uniqueTokens([
      trxAsset,
      ...trc10Assets,
      ...hydratedStoredTokens,
    ]);

    const searchKey = keyWord.trim();
    if (/^[1-9]\d{0,20}$/.test(searchKey)) {
      const trc10Token = await buildTrc10Asset(address, searchKey, undefined, nodeInfo);
      if (trc10Token) candidates.push(trc10Token);
    }
    if (TronWeb.isAddress(searchKey)) {
      const contractToken = await buildContractAsset(address, searchKey, type === 5 ? 5 : undefined, {}, nodeInfo);
      if (contractToken) candidates.push(contractToken);
    }

    const token = uniqueTokens(candidates)
      .filter((item) => matchesSearch(item, searchKey, type))
      .slice(0, count);

    return {
      success: true,
      data: {
        count: token.length,
        token,
      },
    };
  } catch (error) {
    log.error('searchTokens:', error);
    return { success: false, data: { count: 0, token: [] }, error: DEFAULT_ERROR };
  }
}

export async function getCollectionRecordsByTronLinkServer(
  _address: string,
  _tokenAddress: string,
  _start = 0,
  _limit = 20,
  _options = {},
): Promise<ApiResponse> {
  return { success: true, data: [] };
}

export async function getTransactionsByTronLinkServer(
  _address: string,
  _tokenId: string,
  fingerprint = 0,
  _direction = 'all',
  _limit = 30,
): Promise<ApiResponse> {
  return {
    success: true,
    data: {
      records: [],
      finger: fingerprint || 0,
      error: '',
    },
  };
}

export const getCollectionInfo = async (
  _address: string,
  tokenAddress: string,
  assetId: string | number,
): Promise<ApiResponse> => ({
  success: true,
  data: {
    tokenAddress,
    assetId: `${assetId}`,
    name: `${assetId}`,
    intro: '',
    price: '',
    logoUrl: '',
    imageUrl: '',
    assetUri: '',
  } as CollectionType,
});

export const getWitnessInfo = async (_address: string): Promise<ApiResponse> => ({
  success: false,
  data: {},
});

export const getDelegatedResource = async (
  _address: string,
  _type: 1 | 2,
  _sourceType: 1 | 2,
  _start = 0,
  _limit = 50,
): Promise<ApiResponse> => ({
  success: true,
  data: { data: [] },
});

export const getWhiteTokens = async (_address: string, _contractAddress: string): Promise<ApiResponse> => ({
  success: true,
  data: false,
});

export const syncCustomToken = async (_address: string, _tokenAddress: string): Promise<ApiResponse> => ({
  success: true,
  data: true,
});

export const checkIsRiskToken = async (_address: string, _tokenAddress: string): Promise<ApiResponse> => ({
  success: true,
  data: false,
});

export const getRecommendList = async (_address: string): Promise<ApiResponse> => ({
  success: true,
  data: [],
});

export const fetchAccountsTotalTrx = async (
  _address: string,
  addressArr: Array<{ [key: string]: number }>,
): Promise<ApiResponse> => {
  try {
    const nodeInfo = getCurrentNode();
    const balanceList = await Promise.all(
      addressArr.map(async (item) => {
        const address = Object.keys(item)[0];
        const trx = await buildTrxAsset(address, nodeInfo);
        return {
          address,
          balance: trx.trxCount || 0,
          usdBalance: 0,
          cnyBalance: 0,
        };
      }),
    );
    return { success: true, data: { balanceList } };
  } catch (error) {
    log.error('fetchAccountsTotalTrx:', error);
    return { success: false, data: { balanceList: [] }, error: DEFAULT_ERROR };
  }
};

export const getAllDapps = async (_address: string): Promise<ApiResponse> => ({
  success: true,
  data: [],
});

export const fetchSingleAsset = async (
  address: string,
  tokenType: number,
  tokenAddress: string,
): Promise<ApiResponse> => {
  try {
    if (Number(tokenType) === 0) {
      return { success: true, data: await buildTrxAsset(address) };
    }
    if (Number(tokenType) === 1) {
      const token = await buildTrc10Asset(address, tokenAddress);
      return { success: !!token, data: token || {}, error: token ? '' : DEFAULT_ERROR };
    }
    const token = await buildContractAsset(
      address,
      tokenAddress,
      Number(tokenType) === 5 ? 5 : 2,
    );
    return { success: !!token, data: token || {}, error: token ? '' : DEFAULT_ERROR };
  } catch (error) {
    log.error('fetchSingleAsset:', error);
    return { success: false, data: {}, error: DEFAULT_ERROR };
  }
};

export const getMultiTrxRecord = async (_address: string): Promise<ApiResponse> => {
  const rootState = (() => {
    try {
      return getStore().getState();
    } catch (e) {
      return undefined;
    }
  })();

  if (rootState?.nodeManagement?.selectedNode !== NODE_ID_NILE) {
    return { success: true, data: { data: [] } };
  }
  return { success: true, data: { data: [] } };
};

export const getWebsiteBlacklist = async (_address: string): Promise<ApiResponse> => ({
  success: true,
  data: [],
});
