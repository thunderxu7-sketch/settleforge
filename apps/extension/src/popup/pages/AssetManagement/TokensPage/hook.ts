import { useCallback, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import log from 'loglevel';

import { getSelectedNode } from '../../../../store/slices/node_management';
import { selectAddressInfo } from '../../../../store/slices/address_info';
import { resourceManager } from './../../../../domain/resource_manager';
import {
  afterInputChange,
  getHistorySearch,
  clearHistorySearch,
} from './../../../../domain/storage_search_history';
import {
  addAsset,
  searchTokens,
  queryCustomToken,
  getHotTokens,
} from '../../../../service/local_data_service';

import { useSaveLatestLocation } from '../../../../hooks/location';
import { NODE_ID_MAIN, TRON_NODES } from '../../../../constants/tron_nodes';
import { FRONT_API_TIME_OUT } from '../../../../constants/api';
import { AssetItemType } from './../../../../constants/types';
import { getNodeList } from './../../../../store/slices/node_management';
import { useAppSelector } from '../../../../store/hooks';
import { changeKeyRed } from '../../../utils';

import Toast from '../../../../components/Toast';

import TokenCustomDefaultImg from '../../../../static/images/token_custom_default.svg';
import Token10DefaultImg from '../../../../static/images/token_10_default.svg';

interface HistoryTokenType {
  id: string | number;
  symbol: string;
  url?: string;
}
interface PartialAssetType {
  tokenAddress: string;
  symbol?: string;
  name?: string;
  type?: number;
  tokenBalance?: number | string;
  tokenBalanceUsd?: number | string;
  added: boolean;
}

interface State {
  historyTokens: Array<HistoryTokenType>;
  hotTokens: Array<PartialAssetType>;
  searchResultTokens: Array<PartialAssetType>;
  deleteToken: DeleteTokenType;
  clearTokenModalVisible: boolean;
  searchValue: string;
  historyRef: string;
  tokenDomList: any;
  showCustomEntry: boolean;
  resultContentVisible: boolean;
  currentFilterType: number;
}

interface DeleteTokenType {
  show: boolean;
  isCustom: boolean;
  paramsKey: string;
  tokenId: string;
  symbol: string;
}

interface HistorySearchType {
  id?: string;
  url?: string;
  shortName?: string;
  keyWord: string;
}

type Action =
  | { type: 'SET_CLEAR_MODAL_VISIBLE'; payload: boolean }
  | { type: 'SET_TOKEN_DOM_LIST'; payload: PartialAssetType }
  | { type: 'UPDATE_HISTORY_TOKENS'; payload: any }
  | { type: 'UPDATE_HISTORY_REF'; payload: string }
  | { type: 'UPDATE_HOT_TOKENS'; payload: any }
  | { type: 'SHOW_DELETE_MODAL'; payload: DeleteTokenType }
  | { type: 'UPDATE_SEARCH_RESULT_TOKENS'; payload: any }
  | { type: 'UPDATE_SHOW_CUSTOM_ENTRY'; payload: boolean }
  | { type: 'RESULT_CONTENT_VISIBLE'; payload: boolean }
  | { type: 'UPDATE_SEARCH_VALUE'; payload: any }
  | { type: 'UPDATE_CURRENT_FILTER_TYPE'; payload: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_CLEAR_MODAL_VISIBLE':
      return {
        ...state,
        clearTokenModalVisible: action.payload,
      };
    case 'SET_TOKEN_DOM_LIST':
      return {
        ...state,
        tokenDomList: action.payload,
      };
    case 'SHOW_DELETE_MODAL':
      return {
        ...state,
        deleteToken: action.payload,
      };
    case 'UPDATE_HISTORY_TOKENS':
      return {
        ...state,
        historyTokens: action.payload,
      };
    case 'UPDATE_HISTORY_REF':
      return {
        ...state,
        historyRef: action.payload,
      };
    case 'UPDATE_HOT_TOKENS':
      return {
        ...state,
        hotTokens: action.payload,
      };
    case 'UPDATE_SEARCH_RESULT_TOKENS':
      return {
        ...state,
        searchResultTokens: [...action.payload],
      };
    case 'UPDATE_SEARCH_VALUE':
      return {
        ...state,
        searchValue: action.payload,
      };
    case 'UPDATE_SHOW_CUSTOM_ENTRY':
      return {
        ...state,
        showCustomEntry: action.payload,
      };
    case 'RESULT_CONTENT_VISIBLE':
      return {
        ...state,
        resultContentVisible: action.payload,
      };
    case 'UPDATE_CURRENT_FILTER_TYPE':
      return {
        ...state,
        currentFilterType: action.payload,
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
  historyTokens: [],
  hotTokens: [],
  deleteToken: initDeleteToken,
  searchResultTokens: [],
  clearTokenModalVisible: false,
  searchValue: '',
  historyRef: '',
  showCustomEntry: false,
  tokenDomList: [],
  resultContentVisible: false,
  currentFilterType: 0,
};

export const useAssetsManagementBiz = () => {
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

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const func = async () => {
      await setHistoryData();
      // await resourceManager.setHotTokens(selectedAddress, selectedNode);
      await resourceManager.getResourceInfoFromStorage();
      await updateAssetList(false);
      await updateAssetList(true);
    };
    func();
  }, []);

  useEffect(() => {
    if (state.searchValue === '') {
      setCurrentFilterType(0);
    } else {
      querySearchToken(state.searchValue);
    }
  }, [state.searchValue]);

  useEffect(() => {
    if (state.searchValue !== '') {
      querySearchToken(state.searchValue);
    }
  }, [state.currentFilterType]);

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
        Toast.hide();

        Toast.show({
          icon: 'success',
          duration: 3000,
          content: intl.formatMessage({ id: 'ASSET.FOLLOWED_NOW' }),
        });
        setTimeout(async () => {
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
      log.info('onFollowAsset error: ', error);
    }
  };

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
      const symbol = token.name || token.shortName;
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
      log.info(error);
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
      const deleteToken = state.deleteToken;
      const { paramsKey, tokenId } = deleteToken;
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
        Toast.hide();
        dispatch({
          type: 'SHOW_DELETE_MODAL',
          payload: { ...initDeleteToken },
        });
        if (state.searchValue) {
          await querySearchToken(state.searchValue);
        }
        Toast.show({
          icon: 'success',
          duration: 3000,
          content: intl.formatMessage({ id: 'ASSET.UN_FOLLOWED_NOW' }),
        });

        setTimeout(async () => {
          await updateAssetList();
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
      log.info(error);
    }
  };

  const updateAssetList = async (needRefreshResources = true) => {
    try {
      if (state.searchValue) {
        querySearchToken(state.searchValue);
      }
      let hotTokenData = [];

      if (needRefreshResources) {
        Toast.show({
          icon: 'loading',
          duration: 0,
        });
        const res = await getHotTokens(selectedAddress);
        if (res.success) {
          // Toast.hide();
          hotTokenData = res?.data;
        } else {
          res.error &&
            res.error.indexOf(FRONT_API_TIME_OUT) !== -1 &&
            Toast.show({
              icon: 'fail',
              duration: 3000,
              content: intl.formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
            });
        }
        await resourceManager.setAllAssetList(selectedAddress, selectedNode);
        Toast.hide();
      }
      dispatch({
        type: 'UPDATE_HOT_TOKENS',
        payload: hotTokenData,
      });
    } catch (error) {
      log.info(error);
    }
  };

  const goBack = useCallback(() => {
    // the entrance is not fixed
    navigate(-1);
  }, [navigate]);

  const clearHistory = async () => {
    clearHistorySearch();
    dispatch({
      type: 'SET_CLEAR_MODAL_VISIBLE',
      payload: false,
    });
    dispatch({
      type: 'UPDATE_HISTORY_TOKENS',
      payload: [],
    });
  };

  const setClearTokenModalVisible = async (visible: boolean) => {
    dispatch({
      type: 'SET_CLEAR_MODAL_VISIBLE',
      payload: visible,
    });
  };

  const setHistoryData = async () => {
    const searchList = await getHistorySearch();

    dispatch({
      type: 'UPDATE_HISTORY_TOKENS',
      payload: searchList,
    });
  };

  const updateResultTokens = (tokens: any) => {
    dispatch({
      type: 'UPDATE_SEARCH_RESULT_TOKENS',
      payload: tokens,
    });

    if (tokens.length == 0) {
      dispatch({
        type: 'RESULT_CONTENT_VISIBLE',
        payload: false,
      });
    }
  };

  const setSearchValue = (searchKey: string) => {
    dispatch({
      type: 'UPDATE_SEARCH_VALUE',
      payload: searchKey,
    });
  };

  const querySearchToken = async (searchKey: string) => {
    try {
      if (searchKey === '') {
        updateResultTokens([]);
        return;
      }

      Toast.show({
        icon: 'loading',
        duration: 0,
      });

      const res: any = await searchTokens(
        selectedAddress,
        searchKey,
        1,
        100,
        state.currentFilterType,
      );

      // eslint-disable-next-line prefer-const
      let searchInfo: HistorySearchType = { keyWord: searchKey };

      if (res.success) {
        Toast.hide();

        if (res.data.count === 1) {
          const token = res.data.token[0];
          const { type, id, contractAddress, logoUrl, shortName, tokenStatus } = token;
          const tokenImg =
            tokenStatus === 1 || tokenStatus === 2
              ? TokenCustomDefaultImg
              : logoUrl || Token10DefaultImg;

          if (type === 1 && searchKey === id) {
            searchInfo.id = id;
            searchInfo.url = tokenImg;
            searchInfo.shortName = shortName;
          }
          if ((type === 2 || type === 5) && searchKey === contractAddress) {
            searchInfo.id = contractAddress;
            searchInfo.url = tokenImg;
            searchInfo.shortName = shortName;
          }
        }

        if (res?.data?.count !== 0) {
          const asset = res.data.token;
          const dataDomList: any = [];
          asset.map((item: any) => {
            const { shortName, type, name, contractAddress, id } = item;
            let name1 = shortName;
            if (type === 0) name1 = 'TRX';
            let tokenId = contractAddress;
            if (type === 1) tokenId = id;
            const itemData = changeKeyRed([name, name1, type !== 0 ? tokenId : ''], searchKey, {
              direction: 'row',
            });
            if (itemData?.found) {
              dataDomList.push(itemData);
            }
          });
          // log.info(dataDomList);
          dispatch({
            type: 'SET_TOKEN_DOM_LIST',
            payload: dataDomList,
          });
          updateResultTokens(res.data.token);

          const searchList = await afterInputChange(searchInfo);

          dispatch({
            type: 'UPDATE_HISTORY_TOKENS',
            payload: searchList,
          });
        }

        if (res?.data?.count === 0) {
          const customRes = await queryCustomToken(selectedAddress, searchKey);
          const status = _.get(customRes, 'data.status', 2);
          if (status === 0) {
            // show add custom token case
            dispatch({
              type: 'UPDATE_SHOW_CUSTOM_ENTRY',
              payload: true,
            });
          } else {
            updateResultTokens([]);
            dispatch({
              type: 'UPDATE_SHOW_CUSTOM_ENTRY',
              payload: false,
            });
          }
        }
      } else {
        res.error && res.error.indexOf(FRONT_API_TIME_OUT) !== -1
          ? Toast.show({
              icon: 'fail',
              content: intl.formatMessage({
                id: 'EXCEPTION.NETWORK.TIMEOUT',
              }),
              duration: 3000,
            })
          : Toast.hide();
      }

      dispatch({
        type: 'RESULT_CONTENT_VISIBLE',
        payload: true,
      });
    } catch (error) {
      log.info('querySearchToken error: ', error);
    }
  };

  const searchHistoryKey = (keyWord: string) => {
    dispatch({
      type: 'UPDATE_HISTORY_REF',
      payload: keyWord,
    });

    setSearchValue(keyWord);
  };

  const clearHistoryRef = () => {
    dispatch({
      type: 'UPDATE_HISTORY_REF',
      payload: '',
    });
  };

  const setCurrentFilterType = (type: number) => {
    dispatch({
      type: 'UPDATE_CURRENT_FILTER_TYPE',
      payload: type,
    });
  };

  return {
    state,
    goBack,

    clearHistory,
    setClearTokenModalVisible,
    setSearchValue,
    tronscanHost,
    assetOperation,
    cancelDeleteToken,
    confirmDeleteToken,
    onFollowAsset,
    searchHistoryKey,
    clearHistoryRef,
    updateResultTokens,
    setCurrentFilterType,
  };
};
