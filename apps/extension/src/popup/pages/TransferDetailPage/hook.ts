import _ from 'lodash';
import log from 'loglevel';
import { useEffect, useReducer } from 'react';
import { useLocation } from 'react-router';
import { useIntl } from 'react-intl';

import { useAppSelector } from '../../../store/hooks';
import { selectAddressInfo } from '../../../store/slices/address_info';
import { useSaveLatestLocation } from '../../../hooks/location';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import {
  getTransactionsByTronLinkServer,
  getCollectionRecordsByTronLinkServer,
} from '../../../service/local_data_service';
import { getTokenId } from '../Transfer/utils/token';

import Toast from '../../../components/Toast';

interface State {
  transactionDetail: any;
  tronLinkTransactionDetail: any;
  chainParameters: any;
}

const initialState: State = {
  chainParameters: {},
  tronLinkTransactionDetail: {
    toAddress: '',
    fromAddress: '',
    amount: 0,
  },
  transactionDetail: {
    block: 0,
    timestamp: 0,
    remarks: '',
    receipt: {},
    transferState: 'SUCCESS',
    fee: 0,
  },
};

type Action =
  | { type: 'SET_TRANSACTION_DETAIL'; payload: any }
  | { type: 'SET_TRON_LINK_TRANSACTION_DETAIL'; payload: any }
  | { type: 'SET_CHAIN_PARAMETERS'; payload: any };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_TRANSACTION_DETAIL':
      return {
        ...state,
        transactionDetail: action.payload,
      };
    case 'SET_TRON_LINK_TRANSACTION_DETAIL':
      return {
        ...state,
        tronLinkTransactionDetail: action.payload,
      };
    case 'SET_CHAIN_PARAMETERS':
      return {
        ...state,
        chainParameters: action.payload,
      };

    default:
      return state;
  }
};

export const useTransferDetailBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { formatMessage } = useIntl();

  const location = useLocation();
  const { txId, selectedToken, record } = (location.state as any) ?? {};
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo?.selectedAddress ?? '';

  const { tronWebInstance } = useTronWebInstance();

  useSaveLatestLocation();

  useEffect(() => {
    try {
      (async () => {
        const promise1 = getChainParameters();
        const promise2 = getTransactionDetailFromTronweb();
        const promise3 = getTransactionDetailFromTronLinkServer();

        Toast.show({ icon: 'loading', duration: 0 });

        await Promise.all([promise1, promise2, promise3]);

        Toast.hide();
      })();
    } catch (error) {
      log.info('error: ', error);
      Toast.hide();
    }
  }, []);

  const getTransactionDetailFromTronLinkServer = async () => {
    try {
      let tronLinkTransactionDetail;
      if (selectedToken.type === 5) {
        // use record first if it's not empty
        if (record) {
          tronLinkTransactionDetail = record;
        } else {
          const { success, data } = await getCollectionRecordsByTronLinkServer(
            selectedAddress,
            selectedToken.contractAddress,
          );

          if (!success) {
            Toast.show({
              icon: 'fail',
              content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
              duration: 3000,
            });
            return;
          }

          tronLinkTransactionDetail =
            (data &&
              data.find((item: any) => {
                return item.transaction_id === txId;
              })) ??
            {};
        }
        tronLinkTransactionDetail.fromAddress = tronLinkTransactionDetail.from_address;
        tronLinkTransactionDetail.toAddress = tronLinkTransactionDetail.to_address;
      } else {
        if (record) {
          tronLinkTransactionDetail = record;
        } else {
          const { success, data } = await getTransactionsByTronLinkServer(
            selectedAddress,
            getTokenId(selectedToken),
          );

          if (!success) {
            Toast.show({
              icon: 'fail',
              content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
              duration: 3000,
            });
            return;
          }

          tronLinkTransactionDetail =
            (data &&
              data.records.find((item: any) => {
                return item.hash === txId;
              })) ??
            {};
        }
      }

      dispatch({
        type: 'SET_TRON_LINK_TRANSACTION_DETAIL',
        payload: tronLinkTransactionDetail,
      });
    } catch (error) {
      log.info('getTransactionDetailFromTronLinkServer error: ', error);
    }
  };

  const getChainParameters = async () => {
    const chainParametersObj = await tronWebInstance.trx.getChainParameters();
    const chainParameters = _.keyBy(chainParametersObj, 'key');

    dispatch({
      type: 'SET_CHAIN_PARAMETERS',
      payload: chainParameters,
    });

    return chainParameters;
  };

  const getTransactionDetailFromTronweb = async () => {
    let transactionDetail = { txId };
    try {
      const transaction = await tronWebInstance.trx.getTransaction(txId);
      const transactionInfo = await tronWebInstance.trx.getUnconfirmedTransactionInfo(txId);
      const { blockNumber, blockTimeStamp, receipt = {}, fee = 0 } = transactionInfo || {};

      let data = _.get(transaction, 'raw_data.data');
      if (data) {
        data = tronWebInstance.toUtf8(data);
      }

      const transferState = _.get(transaction, 'ret[0].contractRet');

      transactionDetail = Object.assign(transactionDetail, {
        block: blockNumber,
        timestamp: blockTimeStamp,
        remarks: data,
        receipt,
        transferState,
        fee,
      });

      dispatch({
        type: 'SET_TRANSACTION_DETAIL',
        payload: transactionDetail,
      });
    } catch (e) {
      log.info('getTransactionDetailFromTronweb error:', e);
    }
  };

  return {
    txId,
    selectedToken,
    selectedAddress,
    state,
  };
};
