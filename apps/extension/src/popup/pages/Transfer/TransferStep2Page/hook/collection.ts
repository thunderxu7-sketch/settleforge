import _ from 'lodash';
import log from 'loglevel';
import { useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router';
import { useCallback, useEffect, useReducer, useRef } from 'react';

import { useAppSelector } from '../../../../../store/hooks';
import { selectAddressInfo } from '../../../../../store/slices/address_info';
import { searchCollectionListByKeyWords } from '../../../../../service/local_data_service';
import PAGES from '../../../../../constants/pages';
import { CollectionType } from '../../../../../constants/types';
import { FRONT_API_TIME_OUT } from '../../../../../constants/api';
import { State as TokenState } from './token';
import { getCollectionListInfo } from '../../../../utils/assetUtils';

import Toast from '../../../../../components/Toast';
import useCheckLoginBeforeAction from '../../../../../hooks/check_logion_before_action';

export type SelectedCollectionType = CollectionType | undefined;

export interface State {
  selectedCollection: SelectedCollectionType;
  showCollectionSelect: boolean;
  allCollections: CollectionType[];
  searchCollectionKeyWords: string;
  currentPage: number;
  hasGetAllCollection: boolean;
}

const initialState: State = {
  selectedCollection: undefined,
  showCollectionSelect: false,
  allCollections: [],
  searchCollectionKeyWords: '',
  currentPage: 0,
  hasGetAllCollection: false,
};

type Action =
  | { type: 'SET_SHOW_COLLECTION_SELECT'; payload: boolean }
  | { type: 'SET_ALL_COLLECTIONS'; payload: CollectionType[] }
  | { type: 'APPEND_COLLECTIONS'; payload: CollectionType[] }
  | { type: 'SET_SEARCH_COLLECTION_KEY_WORDS'; payload: string }
  | { type: 'SET_HAS_GET_ALL_COLLECTION'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_SELECTED_COLLECTION'; payload: SelectedCollectionType }
  | { type: 'UPDATE_SELECTED_COLLECTION' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_SHOW_COLLECTION_SELECT':
      return {
        ...state,
        showCollectionSelect: action.payload,
      };
    case 'SET_SELECTED_COLLECTION':
      return {
        ...state,
        selectedCollection: action.payload,
      };
    case 'SET_ALL_COLLECTIONS':
      return {
        ...state,
        allCollections: action.payload,
      };
    case 'APPEND_COLLECTIONS':
      return {
        ...state,
        allCollections: [...state.allCollections, ...action.payload],
      };
    case 'SET_SEARCH_COLLECTION_KEY_WORDS':
      return {
        ...state,
        searchCollectionKeyWords: action.payload,
      };
    case 'SET_HAS_GET_ALL_COLLECTION':
      return {
        ...state,
        hasGetAllCollection: action.payload,
      };
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };

    default:
      return state;
  }
};

let isLoadingCollections = false;
export const useTransferStep2CollectionBiz = (
  tokenState: TokenState,
  calFee: (assetId?: string) => any,
  getAccountInfo: (address: string) => any,
) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const { receiverAddress, selectedCollection: defaultCollection } = (location.state as any) ?? {};

  const { selectedToken, tokenAmount, remarks, account } = tokenState;

  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo?.selectedAddress ?? '';
  const isFirstMounted = useRef<boolean>(true);
  const hasGetAllCollectionRef = useRef<boolean>(false);

  useEffect(() => {
    resetCollectionData();
    getAllCollections(true).then();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchCollectionKeyWords, selectedToken]);

  useEffect(() => {
    (async () => {
      let assetId = '';
      if (
        state.selectedCollection &&
        Object.keys(state.selectedCollection).length > 0 &&
        selectedToken.contractAddress === state.selectedCollection.tokenAddress
      ) {
        assetId = state.selectedCollection?.assetId;
      }
      await calFee(assetId);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToken, state.selectedCollection]);

  useEffect(() => {
    const searchCollectionKeyWordsTrimmed = state.searchCollectionKeyWords.trim();
    const allCollections = state.allCollections;
    if (searchCollectionKeyWordsTrimmed.length === 0) {
      if (allCollections.length <= 0) {
        setInnerSelectedCollection(undefined);
        return;
      }

      const { selectedCollection } = state;

      if (selectedCollection) {
        // avoid can't find collection after transfer
        const result = allCollections.find((item: CollectionType) => {
          return item.assetId === selectedCollection.assetId;
        });

        if (!result) {
          setInnerSelectedCollection(allCollections[0]);
        }
      } else {
        // if it's first mounted and from collectionDetail page
        if (isFirstMounted.current && defaultCollection) {
          setInnerSelectedCollection(defaultCollection);
          isFirstMounted.current = false;
        } else {
          setInnerSelectedCollection(allCollections[0]);
        }
      }
    }
  }, [state.allCollections]);

  const resetCollectionData = () => {
    setCurrentPage(0);
    sethHasGetAllCollection(false);
    hasGetAllCollectionRef.current = false;
    setAllCollections([]);
  };

  const getAllCollections = async (forceResetPage = false) => {
    try {
      if (selectedToken.type !== 5 && !selectedToken.contractAddress) {
        return;
      }

      let allCollections = [];
      if (forceResetPage) {
        const { searchCollectionKeyWords } = state;
        const searchCollectionKeyWordsTrimmed = searchCollectionKeyWords.trim();
        if (searchCollectionKeyWordsTrimmed.length > 0) {
          allCollections = await searchCollectionsByKeyWord(searchCollectionKeyWordsTrimmed);
        } else {
          allCollections = await getCollections();
        }
      } else {
        allCollections = await getNextPageCollections();
      }

      if (forceResetPage) {
        setAllCollections(allCollections);
      } else {
        appendCollections(allCollections);
      }
    } catch (error) {
      log.info('getAllCollections error: ', error);
    }
  };

  const getCollections = async () => {
    try {
      const collectionList = await getCollectionsByToken(
        selectedAddress,
        selectedToken.contractAddress,
        0,
        4,
      );

      const collections = _.get(collectionList, 'collectionInfoList') || [];
      setCurrentPage(1);
      return collections;
    } catch (error) {
      log.info('getCollections error: ', error);
      return [];
    }
  };

  const getNextPageCollections = async () => {
    try {
      const { currentPage } = state;

      if (hasGetAllCollectionRef.current) {
        return [];
      }

      const collectionList = await getCollectionsByToken(
        selectedAddress,
        selectedToken.contractAddress,
        state.currentPage,
        4,
      );

      const collections = _.get(collectionList, 'collectionInfoList') || [];
      if (collections.length === 0) {
        sethHasGetAllCollection(true);
        hasGetAllCollectionRef.current = true;
      } else {
        setCurrentPage(currentPage + 1);
      }

      return collections;
    } catch (error) {
      log.info('getCollections error: ', error);
      return [];
    }
  };

  const setAllCollections = useCallback((allCollections: CollectionType[]) => {
    dispatch({
      type: 'SET_ALL_COLLECTIONS',
      payload: allCollections,
    });
  }, []);

  const appendCollections = useCallback((nextPageCollections: CollectionType[]) => {
    dispatch({
      type: 'APPEND_COLLECTIONS',
      payload: nextPageCollections,
    });
  }, []);

  const searchCollectionsByKeyWord = async (searchKey: string) => {
    Toast.show({
      icon: 'loading',
      content: '',
      duration: 3000,
    });

    const res = await searchCollectionListByKeyWords(
      selectedAddress,
      selectedToken.contractAddress,
      searchKey,
    );

    const success = _.get(res, 'success') ?? false;
    const error = _.get(res, 'error') ?? '';
    const collections = _.get(res, 'data.collectionInfoList') ?? [];
    if (!success) {
      error && error.indexOf(FRONT_API_TIME_OUT) !== -1
        ? Toast.show({
            icon: 'fail',
            content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
            duration: 3000,
          })
        : Toast.hide();
    } else {
      Toast.hide();
    }

    return collections;
  };

  const setSelectedCollection = (assetId: string) => {
    const selectedCollection = state.allCollections.find((item) => {
      return assetId === item.assetId;
    });
    if (selectedCollection && Object.keys(selectedCollection).length > 0) {
      setInnerSelectedCollection(selectedCollection);
    }
  };

  const setInnerSelectedCollection = useCallback((collection: SelectedCollectionType) => {
    dispatch({
      type: 'SET_SELECTED_COLLECTION',
      payload: collection,
    });
  }, []);

  const setShowCollectionSelect = useCallback((isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_COLLECTION_SELECT',
      payload: isShow,
    });
  }, []);

  const setSearchCollectionKeyWords = useCallback((keyWords: string) => {
    dispatch({
      type: 'SET_SEARCH_COLLECTION_KEY_WORDS',
      payload: keyWords,
    });
  }, []);

  const sethHasGetAllCollection = useCallback((hasDone: boolean) => {
    dispatch({
      type: 'SET_HAS_GET_ALL_COLLECTION',
      payload: hasDone,
    });
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: page,
    });
  }, []);

  const getCollectionsByToken = async (
    selectedAddress: string,
    tokenAddress: string,
    pageIndex: number,
    pageSize = 20,
  ) => {
    try {
      Toast.show({
        icon: 'loading',
        content: '',
        duration: 3000,
      });

      const result = await getCollectionListInfo(
        selectedAddress,
        selectedToken.contractAddress,
        pageIndex,
        pageSize,
      );

      const success = _.get(result, 'success', false);
      const error = _.get(result, 'error', '');
      if (!success) {
        error && error.indexOf(FRONT_API_TIME_OUT) !== -1
          ? Toast.show({
              icon: 'fail',
              content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
              duration: 3000,
            })
          : Toast.hide();
      } else {
        Toast.hide();
      }

      return _.get(result, 'data') || {};
    } catch (e) {
      log.info('getCollectionsByToken error:', e);
    }
    return {};
  };

  const gotoConfirmPage = async () => {
    let { costs } = tokenState;
    try {
      Toast.show({
        icon: 'loading',
        content: '',
        duration: 0,
      });

      costs = await calFee(state.selectedCollection?.assetId);
    } finally {
      let selectedAccount = account[selectedAddress];
      if (!selectedAccount) {
        selectedAccount = await getAccountInfo(selectedAddress);
      }
      Toast.hide();

      navigate(`${PAGES.PAGE_TRANSFER_STEP_3}`, {
        state: {
          selectedToken,
          fromAddressInfo: addressInfo.addressItems[selectedAddress] ?? {},
          toAddressInfo: receiverAddress,
          transferAmount: tokenAmount,
          costs,
          account: selectedAccount,
          remarks: remarks,
          selectedCollection: state.selectedCollection,
        },
      });
    }
  };

  const getNextPage = async () => {
    if (!isLoadingCollections) {
      isLoadingCollections = true;
      await getAllCollections();
      isLoadingCollections = false;
    }
  };

  return {
    state,
    hasGetAllCollection: hasGetAllCollectionRef.current,
    setShowCollectionSelect,
    setSelectedCollection,
    setSearchCollectionKeyWords,
    gotoConfirmPage: useCheckLoginBeforeAction(gotoConfirmPage),
    getNextPage,
  };
};
