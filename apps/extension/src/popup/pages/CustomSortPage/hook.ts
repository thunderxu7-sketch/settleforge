import { useCallback, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import log from 'loglevel';

import { useSaveLatestLocation } from '../../../hooks/location';
import { getSelectedNode } from '../../../store/slices/node_management';
import { useAppSelector } from '../../../store/hooks';
import { selectAddressInfo } from '../../../store/slices/address_info';
import { resourceManager } from './../../../domain/resource_manager';
import PAGES from '../../../constants/pages';
import { FRONT_API_TIME_OUT } from '../../../constants/api';
import { addAsset } from '../../../service/local_data_service';
import { usePricesInfo } from './../../../hooks/prices_info';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';
import { hideZeroToken, hideZeroTokenTRC721, sortTokenManual } from '../../utils/assetUtils';

import Toast from '../../../components/Toast';

type AssetType = Array<any>;
interface State {
  assetData: AssetType;
  tabIndex: number;
  homeAsset: AssetType;
  homeCollection: AssetType;
  treeData: [];
}

const initialState: State = {
  assetData: [],
  tabIndex: 0,
  homeAsset: [],
  homeCollection: [],
  treeData: [],
};

type Action =
  | { type: 'CHANGE_TAB'; payload: number }
  | { type: 'SET_WALLET_LIST_VISIBLE'; payload: boolean }
  | { type: 'UPDATE_HOME_ASSET'; payload: AssetType }
  | { type: 'UPDATE_HOME_COLLECTION'; payload: AssetType };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'CHANGE_TAB':
      return {
        ...state,
        tabIndex: action.payload,
      };
    case 'UPDATE_HOME_ASSET':
      return {
        ...state,
        homeAsset: action.payload,
      };
    case 'UPDATE_HOME_COLLECTION':
      return {
        ...state,
        homeCollection: action.payload,
      };
    default:
      return state;
  }
};

export const useCustomSortPageBiz = () => {
  const intl = useIntl();
  useSaveLatestLocation();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);

  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo.selectedAddress;
  const selectedNode = useAppSelector(getSelectedNode);
  const { pricesInfo } = usePricesInfo();

  const addressPath = [selectedAddress];
  const nodePath = ['nodes', selectedNode];

  useEffect(() => {
    const func = async () => {
      await resourceManager.getResourceInfoFromStorage();
      await updateHomePageData();

      await updateHomePageData(true);
    };
    func();
  }, []);

  const updateHomePageData = async (needRefreshResources = false) => {
    try {
      if (needRefreshResources) {
        await resourceManager.setFollowedAssetList(selectedAddress, selectedNode);
        await resourceManager.setFollowedCollectionList(selectedAddress, selectedNode);
      }
      const addressData = _.get(resourceManager.resourceInfo, addressPath, {});

      const nodeData = _.get(addressData, nodePath, {});

      // const homeAsset = _.get(addressData, 'followedAsset', []);
      // const homeCollection = _.get(addressData, 'followedCollection', []);
      const homeAsset = await resourceManager.getFollowedAssetList(selectedAddress, selectedNode);
      const homeCollection = await resourceManager.getFollowedCollectionList(
        selectedAddress,
        selectedNode,
      );

      const hideSmallWorthAsset = _.get(nodeData, 'hideSmallWorthAsset', false);

      // processing asset by sort rules and check if hide small asset
      let homeAssetHide = homeAsset.slice();
      let homeCollectionHide = homeCollection.slice();
      if (hideSmallWorthAsset) {
        homeAssetHide = hideZeroToken(homeAsset, pricesInfo);
        homeCollectionHide = hideZeroTokenTRC721(homeCollection);
      }

      const sortManualAsset = _.get(nodeData, 'sortManualAsset', []);
      const sortManualCollection = _.get(nodeData, 'sortManualCollection', []);

      const homeAssetSort = sortTokenManual(homeAssetHide, sortManualAsset);
      const homeCollectionSort = sortTokenManual(homeCollectionHide, sortManualCollection);

      dispatch({
        type: 'UPDATE_HOME_ASSET',
        payload: homeAssetSort,
      });
      dispatch({
        type: 'UPDATE_HOME_COLLECTION',
        payload: homeCollectionSort,
      });
    } catch (error) {
      log.info('updateHomePageData error: ', error);
    }
  };

  const changeTab = (tabIndex: number) => {
    dispatch({ type: 'CHANGE_TAB', payload: tabIndex });
  };

  const setAssetData = (data: any, tabIndex: number) => {
    if (tabIndex === 0) {
      dispatch({
        type: 'UPDATE_HOME_ASSET',
        payload: data,
      });
    } else {
      dispatch({
        type: 'UPDATE_HOME_COLLECTION',
        payload: data,
      });
    }
  };

  const confirmSort = async () => {
    const { tabIndex, homeAsset, homeCollection } = state;
    if (tabIndex === 0) {
      await resourceManager.setSortManualAsset(homeAsset, selectedAddress, selectedNode, 1);
    } else {
      await resourceManager.setSortManualAsset(homeCollection, selectedAddress, selectedNode, 2);
    }
    navigate(PAGES.PAGE_HOMEPAGE);
  };

  const goBack = useCallback(() => {
    navigate(PAGES.PAGE_HOMEPAGE);
  }, [navigate]);

  const deleteToken = async (deleteToken: any) => {
    try {
      const { type } = deleteToken;
      if (type === 0) return;
      let paramsKey = 'token20';
      let tokenId = deleteToken.contractAddress;
      if (type === 1) {
        paramsKey = 'token10';
        tokenId = deleteToken.id;
      } else if (type === 5) {
        paramsKey = 'token721';
      }
      paramsKey += 'Cancel';
      if (!paramsKey || !tokenId) return;
      const params = {
        [paramsKey]: [tokenId],
      };
      Toast.show({
        icon: 'loading',
        duration: 5000,
      });
      const res = await addAsset(selectedAddress, params);
      if (res.success) {
        setTimeout(async () => {
          Toast.hide();
          Toast.show({
            icon: 'success',
            duration: 3000,
            content: intl.formatMessage({ id: 'ASSET.UN_FOLLOWED_NOW' }),
          });
          updateHomePageData(true);
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
      log.error(error);
    }
  };

  return {
    state,
    goBack,

    changeTab,
    confirmSort: useCheckLoginBeforeAction(confirmSort),
    setAssetData,
    deleteToken,
  };
};
