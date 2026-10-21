import _ from 'lodash';
import log from 'loglevel';
// @ts-ignore
import TronWeb from 'tronweb';
import { useEffect, useReducer } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useIntl } from 'react-intl';

import { msgNode } from '../../../../inst';
import { usePricesInfo } from '../../../../../hooks/prices_info';
import { useSaveLatestLocation } from '../../../../../hooks/location';
import { useTronWebInstance } from '../../../../../hooks/tronweb_popup';
import { useSelectedNodeInfo } from '../../../../../hooks/selected_node_info';
import { useAppSelector } from '../../../../../store/hooks';
import { selectAddressInfo } from '../../../../../store/slices/address_info';
import { selectAddressBook } from '../../../../../store/slices/address_book';
import { selectTransferRecord } from '../../../../../store/slices/transfer_record';
import { callAccountsTypeService } from '../../../../../service/accounts_type_service';
import PAGES from '../../../../../constants/pages';
import { TRON_NODES, NODE_ID_MAIN } from '../../../../../constants/tron_nodes';
import { BLACK_HOLE_ADDRESS } from '../../../../../constants/address';
import { AssetItemType } from '../../../../../constants/types';
import { FRONT_API_TIME_OUT } from '../../../../../constants/api';

import { ACCOUNT_TYPE } from '../../../HomePage/constants';
import {
  getTransactionsByTronLinkServer,
  queryCustomToken,
  searchTokens,
  syncCustomToken,
  fetchSingleAsset,
} from '../../../../../service/local_data_service';
import { checkAddressActive, isRiskAsset } from '../../../../utils/assetUtils';
import { BigNumber } from '../../../../utils/numberUtils';

import Toast from '../../../../../components/Toast';

import TrxLogo from '../../../../common/images/icon-trx-logo.svg';

enum Direc {
  all,
  to,
  from,
}

interface State {
  trxFrozenBalance: string;
  trxAvailableBalance: string;
  trxBalance: string;

  currentTab: number;
  transactions: any[];
  noFunctions: string[];
  finger: number;

  enableJustSwap: boolean;
  isLedger: boolean;
  showRiskTips: boolean;
  showSyncTip: boolean;
  showSyncModal: boolean;
  showPreventTransferModal: boolean;
  showDAppChainModal: boolean;

  isLoadingTransaction: boolean;
  hasLoadAllTransaction: boolean;

  selectedTokenState: AssetItemType;
}

const initialState: State = {
  trxFrozenBalance: '0',
  trxAvailableBalance: '0',
  trxBalance: '0',

  currentTab: 0,
  transactions: [],
  noFunctions: [],
  finger: 0,

  enableJustSwap: false,
  isLedger: false,
  showRiskTips: false,
  showSyncTip: false,
  showSyncModal: false,
  showPreventTransferModal: false,
  showDAppChainModal: false,

  isLoadingTransaction: false,
  hasLoadAllTransaction: false,

  // @ts-ignore some default value
  selectedTokenState: {
    type: 0,
    shortName: '',
    precision: 0,
    inSideChain: true,
    transferStatus: true,
    tokenStatus: 0,
  },
};

type Action =
  | { type: 'SET_CURRENT_TAB'; payload: number }
  | { type: 'SET_TRANSACTIONS'; payload: any }
  | { type: 'SET_SHOW_RISK_TIPS'; payload: boolean }
  | { type: 'SET_SHOW_SYNC_TIPS'; payload: boolean }
  | { type: 'SET_SHOW_SYNC_MODAL'; payload: boolean }
  | { type: 'SET_DISABLE_LOAD_TRANSACTION'; payload: boolean }
  | { type: 'SET_IS_LOADING_TRANSACTION'; payload: boolean }
  | { type: 'SET_HAS_LOAD_ALL_TRANSACTION'; payload: boolean }
  | { type: 'SET_SELECTED_TOKEN_STATE'; payload: AssetItemType }
  | { type: 'SET_SHOW_PREVENT_TRANSFER_MODAL'; payload: boolean }
  | { type: 'INIT_DATA'; payload: any }
  | { type: 'SET_TRX_BALANCE'; payload: any }
  | { type: 'SET_SHOW_DAPP_CHAIN_MODAL'; payload: boolean };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_CURRENT_TAB':
      return {
        ...state,
        currentTab: action.payload,
      };
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload.transactions,
        finger: action.payload.finger,
      };
    case 'SET_SHOW_RISK_TIPS':
      return {
        ...state,
        showRiskTips: action.payload,
      };
    case 'SET_SHOW_SYNC_TIPS':
      return {
        ...state,
        showSyncTip: action.payload,
      };
    case 'SET_SHOW_SYNC_MODAL':
      return {
        ...state,
        showSyncModal: action.payload,
      };
    case 'SET_IS_LOADING_TRANSACTION':
      return {
        ...state,
        isLoadingTransaction: action.payload,
      };
    case 'SET_HAS_LOAD_ALL_TRANSACTION':
      return {
        ...state,
        hasLoadAllTransaction: action.payload,
      };
    case 'SET_SHOW_PREVENT_TRANSFER_MODAL':
      return {
        ...state,
        showPreventTransferModal: action.payload,
      };
    case 'SET_SELECTED_TOKEN_STATE':
      return {
        ...state,
        selectedTokenState: action.payload,
      };
    case 'INIT_DATA':
      return {
        ...state,
        trxFrozenBalance: action.payload.trxBalanceObj?.trxFrozenBalance,
        trxAvailableBalance: action.payload.trxBalanceObj?.trxAvailableBalance,
        trxBalance: action.payload.trxBalanceObj?.trxBalance,
        noFunctions: action.payload.noFunctionsList || [],
        enableJustSwap: action.payload.enableJustSwap,
        isLedger: action.payload.isLedgerAccount,
        showRiskTips: action.payload.showRiskTips,
      };
    case 'SET_TRX_BALANCE':
      return {
        ...state,
        trxFrozenBalance: action.payload?.trxFrozenBalance,
        trxAvailableBalance: action.payload?.trxAvailableBalance,
        trxBalance: action.payload?.trxBalance,
      };
    case 'SET_SHOW_DAPP_CHAIN_MODAL':
      return {
        ...state,
        showDAppChainModal: action.payload,
      };
    default:
      return state;
  }
};

export const useTokenTransferListBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { formatMessage } = useIntl();
  const location = useLocation();
  const { selectedToken: defaultToken } = (location.state as any) ?? {};
  const { id, type, contractAddress }: AssetItemType = defaultToken;

  const tokenId = type === 1 ? id : type === 2 || type === 5 ? contractAddress : '';

  const navigate = useNavigate();

  const { selectedNode, selectedNodeInfo } = useSelectedNodeInfo();

  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo?.selectedAddress ?? '';

  const addressBook = useAppSelector(selectAddressBook);

  const transferLocalRecord = useAppSelector(selectTransferRecord);

  const currentLocalRecords = _.get(transferLocalRecord, [selectedNode, selectedAddress], []);
  const selectedLocalRecord = currentLocalRecords.filter((item) => {
    return item.tokenId === tokenId;
  });

  const { pricesInfo } = usePricesInfo();

  const { tronWebInstance } = useTronWebInstance();

  const { chain, freezeUrl } = selectedNodeInfo;

  useSaveLatestLocation();

  useEffect(() => {
    (async () => {
      // need set first, avoid cover search api result
      dispatch({
        type: 'SET_SELECTED_TOKEN_STATE',
        payload: defaultToken,
      });

      const showRiskTips = getIsRiskTokens();
      const [trxBalanceObj, noFunctionsList, enableJustSwap, isLedgerAccount] = await Promise.all([
        getTrxBalance(),
        getNoFunctions(),
        getEnableJustSwap(),
        getIsAccountType(),
      ]);

      dispatch({
        type: 'INIT_DATA',
        payload: {
          trxBalanceObj,
          noFunctionsList,
          enableJustSwap,
          isLedgerAccount,
          showRiskTips,
        },
      });
    })();

    // 30s loop get token amount
    const tokenTimer = setInterval(async () => {
      if (type === 0) {
        const trxBalanceObj = await getTrxBalance();
        dispatch({
          type: 'SET_TRX_BALANCE',
          payload: trxBalanceObj,
        });
      }
      getTokenInfo();
    }, 30 * 1000);
    return () => {
      clearInterval(tokenTimer);
    };
  }, []);

  useEffect(() => {
    getTransactionList();
  }, [state.currentTab]);

  useEffect(() => {
    getTokenInfo();
  }, [state.showSyncModal]);

  const getTokenInfo = async () => {
    try {
      let res;
      if (type === 0) {
        res = await fetchSingleAsset(selectedAddress, type, '');
        res.data.price = 1;
        res.data.precision = 6;
        res.data.name = 'TRX';
        res.data.shortName = 'TRX';
        res.data.logoUrl = TrxLogo;
      } else {
        res = await searchTokens(selectedAddress, tokenId);
      }
      const { success, data } = res;

      if (success && data) {
        let token;
        if (type === 0) {
          token = data;
        } else {
          token = data.token[0];
        }

        if (token.tokenStatus === 2) {
          setShowSyncTips(true);
        } else {
          setShowSyncTips(false);
        }

        dispatch({
          type: 'SET_SELECTED_TOKEN_STATE',
          payload: token,
        });
      }
    } catch (error) {
      log.debug('searchTokens error: ', error);
    }
  };

  const getTrxBalance = async () => {
    try {
      Toast.show({
        icon: 'loading',
        duration: 0,
      });
      const account = await tronWebInstance.trx.getUnconfirmedAccount(selectedAddress);
      Toast.hide();

      const trxFrozenBalance =
        _.get(account, 'frozen[0].frozen_balance', 0) +
        _.get(account, 'account_resource.frozen_balance_for_energy.frozen_balance', 0) +
        _.get(account, 'delegated_frozen_balance_for_bandwidth', 0) +
        _.get(account, 'account_resource.delegated_frozen_balance_for_energy', 0);
      const trxAvailableBalance = account?.balance || 0;

      return {
        trxBalance: new BigNumber(trxFrozenBalance + trxAvailableBalance).shiftedBy(-6).toFixed(),
        trxFrozenBalance: new BigNumber(trxFrozenBalance).shiftedBy(-6).toFixed(),
        trxAvailableBalance: new BigNumber(trxAvailableBalance).shiftedBy(-6).toFixed(),
      };
    } catch (error) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
        duration: 3000,
      });

      log.info('getTrxBalance error: ', error);
    }
  };

  const getTransactionList = async () => {
    try {
      const { isLoadingTransaction, hasLoadAllTransaction } = state;
      if (isLoadingTransaction || hasLoadAllTransaction) {
        return;
      }
      setIsLoadingTransaction(true);
      Toast.show({
        icon: 'loading',
        duration: 0,
      });

      const { currentTab, finger: fingerprint } = state;
      const direc = Direc[currentTab];
      const { success, data } = await getTransactionsByTronLinkServer(
        selectedAddress,
        tokenId,
        fingerprint,
        direc,
        30,
      );

      const { error, finger = 0, records } = data;
      setIsLoadingTransaction(false);
      Toast.hide();

      if (!success) {
        Toast.show({
          icon: 'fail',
          content: formatMessage({ id: error }),
        });

        return;
      }

      if (records.length === 0 || records.length < 30 || (!finger && finger !== 0)) {
        setHasLoadAllTransaction(true);
      }

      let localRecord: any[] = [];
      if (fingerprint === 0) {
        // filter useless local record
        localRecord = selectedLocalRecord.filter((localInfo: any, index) => {
          const { fromAddress, toAddress } = localInfo;
          if (
            (fromAddress === selectedAddress && currentTab === 2) ||
            (toAddress === selectedAddress && currentTab === 1)
          ) {
            return false;
          }
          const now = Date.now();
          const existInfo = _.find(records, (o) => {
            return o.hash === localInfo.txId;
          });

          // timeout five minutes
          if ((localInfo.timestamp || 0) + 5 * 60 * 1000 < now || existInfo) {
            return false;
          }

          localInfo.hash = localInfo.txId;
          return true;
        });
      }

      // combine local record and tron link server record together
      const pageTransactions = [...records, ...localRecord];
      const { transactions } = state;
      const newTransactions = [...transactions, ...pageTransactions];
      dispatch({
        type: 'SET_TRANSACTIONS',
        payload: {
          transactions: _.orderBy(newTransactions, ['timestamp'], ['desc']),
          finger: finger + 1,
        },
      });
    } catch (error) {
      log.info('getTransactionList error: ', error);
    }
  };

  const getNoFunctions = async () => {
    try {
      const { tokenStatus } = state.selectedTokenState;
      const isCustomToken = Number(tokenStatus) === 1 || Number(tokenStatus) === 2;
      if (isCustomToken) {
        const res = await queryCustomToken(selectedAddress, tokenId);
        const success = _.get(res, 'success', false);
        const error = _.get(res, 'error', '');
        const customTokenInfo = _.get(res, 'data', {});
        if (!success || !customTokenInfo || error.indexOf(FRONT_API_TIME_OUT) !== -1) {
          Toast.show({
            icon: 'fail',
            content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
            duration: 3000,
          });
        }

        const noFunctionsList = _.get(customTokenInfo, 'noFunctions', '').split(',');
        return noFunctionsList;
      }
      return [];
    } catch (error) {
      log.info('getNoFunctions error: ', error);
    }
  };

  const getEnableJustSwap = async () => {
    let enableJustSwap = false;
    const id = type === 0 ? BLACK_HOLE_ADDRESS[0] : tokenId;
    const { netType } = selectedNodeInfo;
    const contractAddress = 'TXk8rQSAvPvBBNtqSoY6nCfsXWCSSpTVQF';
    const disableAddressHex = '410000000000000000000000000000000000000000';
    if (chain === '_' && netType === 0) {
      if (id === BLACK_HOLE_ADDRESS[0]) {
        enableJustSwap = true;
      } else {
        // judge justSwap by contract address
        if (TronWeb.isAddress(id)) {
          try {
            const { fullNode, solidityNode, eventServer } = TRON_NODES[NODE_ID_MAIN];
            const tronWeb = new TronWeb({ fullNode, solidityNode, eventServer, privateKey: '01' });
            const contractInstance = await tronWeb.contract().at(contractAddress);
            const addressHex = await contractInstance.getExchange(id).call();
            if (addressHex !== disableAddressHex) {
              enableJustSwap = true;
            }
          } catch (e) {
            log.info('justSwap judge err', e);
          }
        }
      }
    }

    return enableJustSwap;
  };

  const getIsAccountType = async () => {
    const accountsType = await callAccountsTypeService(msgNode);
    const accountType = accountsType[selectedAddress];
    return accountType === ACCOUNT_TYPE.LEDGER;
  };

  const getIsRiskTokens = () => {
    return isRiskAsset(state.selectedTokenState);
  };

  const confirmSyncToken = async () => {
    Toast.show({
      icon: 'loading',
      duration: 15000,
    });

    const res = await syncCustomToken(selectedAddress, tokenId);
    if (_.get(res, 'data')) {
      Toast.show({
        icon: 'success',
        content: formatMessage({ id: 'ASSET.CUSTOM.SYNC.SUCCESS' }),
      });
    } else {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'TRANSACTIONS.FAILED' }),
      });
    }
    setShowSyncModal(false);
  };

  const setCurrentTab = (tabIndex: number) => {
    dispatch({
      type: 'SET_CURRENT_TAB',
      payload: tabIndex,
    });

    dispatch({
      type: 'SET_TRANSACTIONS',
      payload: { transactions: [], finger: 0 },
    });

    setIsLoadingTransaction(false);
    setHasLoadAllTransaction(false);
  };

  const setShowPreventTransferModal = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_PREVENT_TRANSFER_MODAL',
      payload: isShow,
    });
  };

  const navigateToTransfer = async () => {
    try {
      Toast.show({
        icon: 'loading',
        duration: 0,
      });

      const isOnlineAddress = await checkAddressActive(tronWebInstance, selectedAddress);
      Toast.hide();
      if (!isOnlineAddress) {
        setShowPreventTransferModal(true);
      } else {
        navigate(`${PAGES.PAGE_TRANSFER_STEP_1}`, { state: { selectedTokenId: tokenId } });
      }
    } catch (error) {
      Toast.hide();
      log.info('navigateToTransfer error: ', error);
    }
  };

  const navigateToTokenDetail = () => {
    navigate(`${PAGES.PAGE_ASSET_DETAIL}/token_detail`, {
      state: { selectedToken: state.selectedTokenState },
    });
  };

  const navigateToTransferDetail = (txId: string, record: any) => {
    navigate(PAGES.PAGE_TRANSFER_DETAIL, {
      state: { txId, selectedToken: state.selectedTokenState, record },
    });
  };

  const getNextPageTransactions = () => {
    getTransactionList();
  };

  const setShowRiskTips = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_RISK_TIPS',
      payload: isShow,
    });
  };

  const setShowSyncTips = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_SYNC_TIPS',
      payload: isShow,
    });
  };

  const setShowSyncModal = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_SYNC_MODAL',
      payload: isShow,
    });
  };

  const setIsLoadingTransaction = (disable: boolean) => {
    dispatch({
      type: 'SET_IS_LOADING_TRANSACTION',
      payload: disable,
    });
  };

  const setHasLoadAllTransaction = (disable: boolean) => {
    dispatch({
      type: 'SET_HAS_LOAD_ALL_TRANSACTION',
      payload: disable,
    });
  };

  const setShowDAppChainModal = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_DAPP_CHAIN_MODAL',
      payload: isShow,
    });
  };

  return {
    state,
    tokenId,
    freezeUrl,
    pricesInfo,
    addressBook,
    selectedNode,
    selectedAddress,
    navigateToTokenDetail,
    navigateToTransferDetail,
    navigateToTransfer,
    setCurrentTab,
    getNextPageTransactions,
    setShowRiskTips,
    setShowSyncTips,
    setShowSyncModal,
    setShowPreventTransferModal,
    confirmSyncToken,
    setShowDAppChainModal,
  };
};
