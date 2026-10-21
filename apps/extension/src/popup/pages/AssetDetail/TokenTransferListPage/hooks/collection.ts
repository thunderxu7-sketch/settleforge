import _ from 'lodash';
import log from 'loglevel';
import { useEffect, useReducer } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useIntl } from 'react-intl';

import { usePricesInfo } from '../../../../../hooks/prices_info';
import { useSelectedNodeInfo } from '../../../../../hooks/selected_node_info';
import { useAppSelector } from '../../../../../store/hooks';
import { selectAddressInfo } from '../../../../../store/slices/address_info';
import { selectAddressBook } from '../../../../../store/slices/address_book';
import { selectTransferRecord } from '../../../../../store/slices/transfer_record';
import PAGES from '../../../../../constants/pages';
import { getCollectionRecordsByTronLinkServer } from '../../../../../service/local_data_service';
import { CollectionType } from '../../../../../constants/types';
import { getCollectionListInfo } from '../../../../utils/assetUtils';

import Toast from '../../../../../components/Toast';

interface State {
  currentTab: number;
  collectionTransactions: any[];
  collectionPage: number;
  collectionTransactionPage: number;
  dappUrl: string;
  collections: CollectionType[];
  hasGetAllCollection: boolean;
  hasGetAllCollectionTransaction: boolean;
  isLoadingCollection: boolean;
  isLoadingCollectionTransaction: boolean;
}

const initialState: State = {
  currentTab: 0,
  collectionTransactions: [],
  collectionPage: 0,
  collectionTransactionPage: 0,
  dappUrl: '',
  collections: [],
  hasGetAllCollection: false,
  hasGetAllCollectionTransaction: false,
  isLoadingCollection: false,
  isLoadingCollectionTransaction: false,
};

type Action =
  | { type: 'SET_CURRENT_TAB'; payload: number }
  | { type: 'SET_COLLECTION_TRANSACTIONS'; payload: any }
  | { type: 'SET_COLLECTIONS'; payload: { dappUrl: string; collections: CollectionType[] } }
  | { type: 'SET_COLLECTION_PAGE'; payload: number }
  | { type: 'SET_HAS_GET_ALL_COLLECTION'; payload: boolean }
  | { type: 'SET_HAS_GET_ALL_COLLECTION_TRANSACTION'; payload: boolean }
  | { type: 'SET_IS_LOADING_COLLECTION'; payload: boolean }
  | { type: 'SET_IS_LOADING_COLLECTION_TRANSACTION'; payload: boolean }
  | { type: 'SET_COLLECTION_TRANSACTION_PAGE'; payload: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_CURRENT_TAB':
      return {
        ...state,
        currentTab: action.payload,
      };
    case 'SET_COLLECTION_TRANSACTIONS':
      return {
        ...state,
        collectionTransactions: action.payload,
      };
    case 'SET_COLLECTIONS':
      return {
        ...state,
        collections: action.payload.collections,
        dappUrl: action.payload.dappUrl,
      };
    case 'SET_COLLECTION_PAGE':
      return {
        ...state,
        collectionPage: action.payload,
      };
    case 'SET_HAS_GET_ALL_COLLECTION':
      return {
        ...state,
        hasGetAllCollection: action.payload,
      };
    case 'SET_HAS_GET_ALL_COLLECTION_TRANSACTION':
      return {
        ...state,
        hasGetAllCollectionTransaction: action.payload,
      };
    case 'SET_IS_LOADING_COLLECTION':
      return {
        ...state,
        isLoadingCollection: action.payload,
      };
    case 'SET_IS_LOADING_COLLECTION_TRANSACTION':
      return {
        ...state,
        isLoadingCollectionTransaction: action.payload,
      };
    case 'SET_COLLECTION_TRANSACTION_PAGE':
      return {
        ...state,
        collectionTransactionPage: action.payload,
      };

    default:
      return state;
  }
};

export const useCollectionTransferListBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const location = useLocation();
  const { formatMessage } = useIntl();
  const { selectedToken } = (location.state as any) ?? {};
  const { id, type, contractAddress } = selectedToken;
  const tokenId = type === 1 ? id : type === 2 || type === 5 ? contractAddress : '';
  const navigate = useNavigate();

  const { selectedNode } = useSelectedNodeInfo();

  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo?.selectedAddress ?? '';

  const transferLocalRecord = useAppSelector(selectTransferRecord);
  const currentLocalRecords = _.get(transferLocalRecord, [selectedNode, selectedAddress], []);
  const selectedLocalRecord = currentLocalRecords.filter((item) => {
    return item.tokenId === tokenId;
  });

  useEffect(() => {
    if (type === 5) {
      getCollectionTransactionList();
      getCollectionListByToken();
    }
  }, []);

  const getCollectionTransactionList = async () => {
    try {
      const {
        collectionTransactions,
        hasGetAllCollectionTransaction,
        isLoadingCollectionTransaction,
      } = state;

      if (hasGetAllCollectionTransaction || isLoadingCollectionTransaction) {
        return collectionTransactions;
      }

      setIsLoadingCollectionTransaction(true);

      Toast.show({
        icon: 'loading',
        duration: 3000,
      });

      const collectionTransactionPageSize = 20;
      const { collectionTransactionPage } = state;
      const { success, data } = await getCollectionRecordsByTronLinkServer(
        selectedAddress,
        tokenId,
        collectionTransactionPage * collectionTransactionPageSize,
        collectionTransactionPageSize,
      );

      setIsLoadingCollectionTransaction(false);

      Toast.hide();

      if (!success) {
        Toast.show({
          icon: 'fail',
          content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
          duration: 3000,
        });

        log.info('getCollectionRecordsByTronLinkServer failed');
        return;
      }

      let localRecord: any[] = [];
      if (collectionTransactionPage === 0) {
        const now = new Date().getTime();

        localRecord = selectedLocalRecord.filter((localInfo: any, index) => {
          const existInfo = _.find(data, (o) => {
            return o.transaction_id === localInfo.txId;
          });

          if ((localInfo.timestamp || 0) + 115 * 60 * 1000 < now || existInfo) {
            // timeout five minutes
            return false;
          }

          localInfo.from_address = localInfo.fromAddress;
          localInfo.to_address = localInfo.toAddress;
          localInfo.block_ts = localInfo.timestamp;
          localInfo.quant = localInfo.assetId;
          localInfo.transaction_id = localInfo.txId;
          return true;
        });
      }

      const pageTransactions = [...data, ...localRecord];
      const newCollectionTransactions = [...collectionTransactions, ...pageTransactions];

      dispatch({
        type: 'SET_COLLECTION_TRANSACTIONS',
        payload: _.orderBy(newCollectionTransactions, ['block_ts'], ['desc']),
      });

      if (data.length === 0 || data.length < collectionTransactionPageSize) {
        sethHasGetAllCollectionTransaction(true);
      } else {
        setCollectionTransactionPage(collectionTransactionPage + 1);
      }
    } catch (error) {
      log.info('getTransferRecord error: ', error);
    }
  };

  const getCollectionListByToken = async () => {
    try {
      const {
        collectionPage,
        hasGetAllCollection,
        collections: allCollections,
        isLoadingCollection,
      } = state;

      if (hasGetAllCollection || isLoadingCollection) {
        return allCollections;
      }
      setIsLoadingCollection(true);

      const collectionPageSize = 20;
      const res = await getCollectionListInfo(
        selectedAddress,
        contractAddress,
        collectionPage,
        collectionPageSize,
      );

      const success = _.get(res, 'success', false);
      if (!success) {
        Toast.show({
          icon: 'fail',
          content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
          duration: 3000,
        });
      }
      const collections = _.get(res, 'data.collectionInfoList') || [];
      const dappUrl = _.get(res, 'data.dappUrl') || [];
      const newCollections = [...allCollections, ...collections];

      setIsLoadingCollection(false);

      dispatch({
        type: 'SET_COLLECTIONS',
        payload: { collections: newCollections, dappUrl },
      });

      if (collections.length === 0 || collections.length < collectionPageSize) {
        sethHasGetAllCollection(true);
      } else {
        setCollectionPage(collectionPage + 1);
      }
    } catch (error) {
      setIsLoadingCollection(false);
      log.info('getCollectionListByToken error: ', error);
    }
  };

  const setCollectionPage = (page: number) => {
    dispatch({
      type: 'SET_COLLECTION_PAGE',
      payload: page,
    });
  };

  const setCollectionTransactionPage = (page: number) => {
    dispatch({
      type: 'SET_COLLECTION_TRANSACTION_PAGE',
      payload: page,
    });
  };

  const sethHasGetAllCollection = (done: boolean) => {
    dispatch({
      type: 'SET_HAS_GET_ALL_COLLECTION',
      payload: done,
    });
  };

  const sethHasGetAllCollectionTransaction = (done: boolean) => {
    dispatch({
      type: 'SET_HAS_GET_ALL_COLLECTION_TRANSACTION',
      payload: done,
    });
  };

  const setCollectionCurrentTab = (tabIndex: number) => {
    dispatch({
      type: 'SET_CURRENT_TAB',
      payload: tabIndex,
    });
  };

  const setIsLoadingCollection = (isLoading: boolean) => {
    dispatch({
      type: 'SET_IS_LOADING_COLLECTION',
      payload: isLoading,
    });
  };

  const setIsLoadingCollectionTransaction = (isLoading: boolean) => {
    dispatch({
      type: 'SET_IS_LOADING_COLLECTION_TRANSACTION',
      payload: isLoading,
    });
  };

  const navigateToCollectionDetail = (assetId: string) => {
    const { collections } = state;
    const selectedCollection = collections.find((item) => item.assetId === assetId);
    navigate(`${PAGES.PAGE_ASSET_DETAIL}/collection_detail`, {
      state: { selectedToken, selectedCollection },
    });
  };

  const getNextPageCollection = () => {
    getCollectionListByToken();
  };

  const getNextPageCollectionTransaction = () => {
    getCollectionTransactionList();
  };

  return {
    state,
    navigateToCollectionDetail,
    setCollectionCurrentTab,
    getNextPageCollection,
    getNextPageCollectionTransaction,
  };
};
