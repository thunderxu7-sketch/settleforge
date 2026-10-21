import { useCallback, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import log from 'loglevel';

import { getNodeList } from './../../../../store/slices/node_management';
import { selectAddressInfo } from '../../../../store/slices/address_info';
import { getSelectedNode } from '../../../../store/slices/node_management';
import { resourceManager } from './../../../../domain/resource_manager';
import { addAsset } from '../../../../service/local_data_service';
import { useSaveLatestLocation } from '../../../../hooks/location';
import { useAppSelector } from '../../../../store/hooks';
import { usePricesInfo } from './../../../../hooks/prices_info';
import {
  hideZeroToken,
  sortTokenManual,
  hideZeroTokenTRC721,
  sortToken,
} from '../../../utils/assetUtils';
import PAGES from '../../../../constants/pages';
import { NODE_ID_MAIN, TRON_NODES } from '../../../../constants/tron_nodes';
import { FRONT_API_TIME_OUT } from '../../../../constants/api';
import { AssetType, AssetItemType } from './../../../../constants/types';

import Toast from '../../../../components/Toast';

enum SortType {
  MANUAL = 1,
  VALUE,
  NAME,
}

export interface DeleteTokenType {
  show: boolean;
  isCustom: boolean;
  paramsKey: string;
  tokenId: string;
  symbol: string;
}

interface State {
  tabIndex: number;
  followedAsset: AssetType;
  hideTokenAsZero: boolean;
  sortType: SortType;
  followedCollection: AssetType;
  deleteToken: DeleteTokenType;
  unFollowedAsset: AssetType;
  unFollowedCollection: AssetType;
  newAsset: AssetType;
  newCollection: AssetType;
}

type Action =
  | { type: 'CHANGE_TAB'; payload: number }
  | { type: 'SET_HIDE_TOKEN_AS_ZERO'; payload: boolean }
  | { type: 'SHOW_DELETE_MODAL'; payload: DeleteTokenType }
  | {
      type: 'SET_ASSET_DATA';
      payload: {
        newAsset: AssetType;
        newCollection: AssetType;
        followedAsset: AssetType;
        unFollowedAsset: AssetType;
        hideTokenAsZero: boolean;
        followedCollection: AssetType;
        unFollowedCollection: AssetType;
      };
    };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'CHANGE_TAB':
      return {
        ...state,
        tabIndex: action.payload,
      };
    case 'SET_HIDE_TOKEN_AS_ZERO':
      return {
        ...state,
        hideTokenAsZero: action.payload,
      };
    case 'SHOW_DELETE_MODAL':
      return {
        ...state,
        deleteToken: action.payload,
      };
    case 'SET_ASSET_DATA':
      return {
        ...state,
        newAsset: action.payload.newAsset,
        newCollection: action.payload.newCollection,
        followedAsset: action.payload.followedAsset,
        unFollowedAsset: action.payload.unFollowedAsset,
        hideTokenAsZero: action.payload.hideTokenAsZero,
        followedCollection: action.payload.followedCollection,
        unFollowedCollection: action.payload.unFollowedCollection,
      };
    default:
      return state;
  }
};

const initDeleteToken = {
  show: false,
  isCustom: false,
  paramsKey: 'token20',
  tokenId: '',
  symbol: '',
};

const initialState: State = {
  tabIndex: 0,
  followedAsset: [],
  unFollowedAsset: [],
  hideTokenAsZero: false,
  sortType: SortType.VALUE,
  followedCollection: [],
  unFollowedCollection: [],
  deleteToken: initDeleteToken,
  newAsset: [],
  newCollection: [],
};
let mounted = false;

export const useAssetsManagementBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const intl = useIntl();
  useSaveLatestLocation();
  const navigate = useNavigate();
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo.selectedAddress;
  const selectedNode = useAppSelector(getSelectedNode);
  const nodeList = useAppSelector(getNodeList);
  const tronscanHost = _.get(
    nodeList,
    [selectedNode, 'hostname'],
    TRON_NODES[NODE_ID_MAIN].hostname,
  );
  const { pricesInfo } = usePricesInfo();
  const addressPath = [selectedAddress];
  const nodePath = ['nodes', selectedNode];

  useEffect(() => {
    const func = async () => {
      Toast.show({
        icon: 'loading',
        content: '',
        duration: 0,
      });
      await updateAssetList();
      mounted = true;
      Toast.hide();
      await updateAssetList(true);
    };
    func();
  }, []);

  const goBack = useCallback(() => {
    navigate(PAGES.PAGE_HOMEPAGE);
  }, [navigate]);

  const changeTab = useCallback((tabIndex: number) => {
    dispatch({ type: 'CHANGE_TAB', payload: tabIndex });
  }, []);

  const gotoTokensPage = useCallback(() => {
    navigate(PAGES.PAGE_ASSETS_MANAGEMENT_TOKENS);
  }, [navigate]);

  // switch for hiding asset when balance is zero
  const onClickHideTokenAsZero = async () => {
    const value = !state.hideTokenAsZero;
    await resourceManager.setHideSmallWorthAsset(selectedAddress, selectedNode, value);

    dispatch({
      type: 'SET_HIDE_TOKEN_AS_ZERO',
      payload: value,
    });
  };

  useEffect(() => {
    const func = async () => {
      await setAssetData();
    };
    mounted && func();
  }, [state.hideTokenAsZero]);

  const assetOperation = async (token: AssetItemType, operationType: string) => {
    try {
      const type = Number(token.type);
      if (type === 0) return;
      let key = 'token20';
      let tokenId = token.contractAddress;
      if (type === 1) {
        key = 'token10';
        tokenId = token.id;
      } else if (type === 5) {
        key = 'token721';
      }
      if (operationType === 'unfocus') {
        key += 'Cancel';
      }

      const tokenStatus = Number(token.tokenStatus);
      const symbol = token.shortName || token.name;
      dispatch({
        type: 'SHOW_DELETE_MODAL',
        payload: {
          show: true,
          isCustom: tokenStatus === 1 || tokenStatus === 2,
          paramsKey: key,
          tokenId,
          symbol,
        },
      });
    } catch (error) {
      log.error(error);
    }
  };

  const cancelDeleteToken = () => {
    dispatch({
      type: 'SHOW_DELETE_MODAL',
      payload: { ...initDeleteToken },
    });
  };

  const confirmDeleteToken = async () => {
    try {
      const deteleToken = state.deleteToken;
      const { paramsKey, tokenId } = deteleToken;
      if (!paramsKey || !tokenId) return;
      const params = {
        [paramsKey]: [tokenId],
      };
      Toast.show({
        icon: 'loading',
        duration: 0,
      });
      const res = await addAsset(selectedAddress, params);
      if (res.success) {
        setTimeout(async () => {
          Toast.hide();
          dispatch({
            type: 'SHOW_DELETE_MODAL',
            payload: { ...initDeleteToken },
          });
          Toast.show({
            icon: 'success',
            duration: 3000,
            content: intl.formatMessage({ id: 'ASSET.UN_FOLLOWED_NOW' }),
          });
          await updateAssetList(true);
        }, 2000);
      } else {
        res.error && res.error.indexOf(FRONT_API_TIME_OUT) !== -1
          ? Toast.show({
              icon: 'fail',
              duration: 3000,
              content: intl.formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
            })
          : Toast.hide();
      }
    } catch (error) {
      Toast.hide();
      log.error(error);
    }
  };

  const setAssetData = async () => {
    try {
      const addressData = _.get(resourceManager.resourceInfo, addressPath, {});
      const nodeData = _.get(addressData, nodePath, {});

      const promise1 = resourceManager.getFollowedAssetList(selectedAddress, selectedNode);
      const promise2 = resourceManager.getFollowedCollectionList(selectedAddress, selectedNode);
      const [followedAsset = [], followedCollection = []] = await Promise.all([promise1, promise2]);

      const sortType = _.get(nodeData, 'sortType', SortType.VALUE);
      const hideSmallWorthAsset = _.get(nodeData, 'hideSmallWorthAsset', false);

      // processing asset by sort rules and check if hide small asset
      let homeAssetHide = followedAsset.slice();
      let homeCollectionHide = followedCollection.slice();
      if (hideSmallWorthAsset) {
        homeAssetHide = hideZeroToken(followedAsset, pricesInfo);
        homeCollectionHide = hideZeroTokenTRC721(followedCollection);
      }
      let homeAssetSort = [];
      let homeCollectionSort = [];
      if (sortType === SortType.MANUAL) {
        const sortManualAsset = _.get(nodeData, 'sortManualAsset', []);
        const sortManualCollection = _.get(nodeData, 'sortManualCollection', []);
        homeAssetSort = sortTokenManual(homeAssetHide, sortManualAsset);
        homeCollectionSort = sortTokenManual(homeCollectionHide, sortManualCollection);
      } else {
        homeAssetSort = sortToken(homeAssetHide, sortType);
        homeCollectionSort = sortToken(homeCollectionHide, sortType, true);
      }

      const newAsset = await resourceManager.getNewAssetList(selectedAddress, selectedNode);
      const newCollection = await resourceManager.getNewCollectionList(
        selectedAddress,
        selectedNode,
      );
      const unFollowedAsset = await resourceManager.getUnFollowedAssetList(
        selectedAddress,
        selectedNode,
      );
      const unFollowedCollectionList = await resourceManager.getUnFollowedCollectionList(
        selectedAddress,
        selectedNode,
      );

      dispatch({
        type: 'SET_ASSET_DATA',
        payload: {
          newAsset: newAsset,
          newCollection: newCollection,
          followedAsset: homeAssetSort,
          unFollowedAsset: unFollowedAsset,
          hideTokenAsZero: hideSmallWorthAsset,
          followedCollection: homeCollectionSort,
          unFollowedCollection: unFollowedCollectionList,
        },
      });
    } catch (error) {
      Toast.show({
        icon: 'fail',
        content: intl.formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
        duration: 3000,
      });

      log.error('setAssetData error: ', error);
    }
  };

  const updateAssetList = async (needRefreshResources = false) => {
    try {
      if (needRefreshResources) {
        await resourceManager.setAllAssetList(selectedAddress, selectedNode);
      } else {
        await resourceManager.getResourceInfoFromStorage();
      }
      await setAssetData();
    } catch (error) {
      log.error(error);
    }
  };

  const onFollowAsset = async (token: AssetItemType) => {
    try {
      Toast.show({
        icon: 'loading',
        duration: 30000,
      });
      const type = Number(token.type);
      if (type === 0) return;
      let key = 'token20';
      let tokenId = token.contractAddress;
      if (type === 1) {
        key = 'token10';
        tokenId = token.id;
      } else if (type === 5) {
        key = 'token721';
      }
      const params = {
        [key]: [tokenId],
      };
      const res = await addAsset(selectedAddress, params);
      if (res.success) {
        setTimeout(async () => {
          Toast.hide();

          Toast.show({
            icon: 'success',
            duration: 3000,
            content: intl.formatMessage({ id: 'ASSET.FOLLOWED_NOW' }),
          });
          await updateAssetList(true);
        }, 2000);
      } else {
        res.error && res.error.indexOf(FRONT_API_TIME_OUT) !== -1
          ? Toast.show({
              icon: 'fail',
              duration: 5000,
              content: intl.formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
            })
          : Toast.hide();
      }
    } catch (error) {
      Toast.hide();
      log.error(error);
    }
  };

  const oneClickFollowAsset = async () => {
    try {
      Toast.show({
        icon: 'loading',
        duration: 30000,
      });
      const asset = (state.tabIndex === 0 ? state.newAsset : state.newCollection) || [];
      const token10: Array<number | string> = [];
      const token20: Array<string> = [];
      const token721: Array<string> = [];
      asset.map((token) => {
        const type = Number(token.type);
        let tokenId = token.contractAddress;
        if (type === 1) {
          tokenId = token.id;
          token10.push(tokenId);
        } else if (type === 5) {
          token721.push(tokenId);
        } else if (type === 2) {
          token20.push(tokenId);
        }
      });
      const params = {
        token10,
        token20,
        token721,
      };
      const res = await addAsset(selectedAddress, params);
      if (res.success) {
        setTimeout(async () => {
          Toast.hide();

          Toast.show({
            icon: 'success',
            duration: 3000,
            content: intl.formatMessage({ id: 'ASSET.FOLLOWED_NOW' }),
          });
          await updateAssetList(true);
        }, 2000);
      } else {
        res.error && res.error.indexOf(FRONT_API_TIME_OUT) !== -1
          ? Toast.show({
              icon: 'fail',
              duration: 5000,
              content: intl.formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
            })
          : Toast.hide();
      }
    } catch (error) {
      Toast.hide();
      log.error(error);
    }
  };

  return {
    state,
    goBack,
    changeTab,
    gotoTokensPage,
    tronscanHost,
    onClickHideTokenAsZero,
    assetOperation,
    cancelDeleteToken,
    confirmDeleteToken,
    onFollowAsset,
    oneClickFollowAsset,
  };
};
