import _ from 'lodash';
import log from 'loglevel';
import { useEffect, useReducer } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useIntl } from 'react-intl';

import { BigNumber } from '../../../../utils/numberUtils';
import { msgNode } from '../../../../inst';
import { useAppSelector, useAppDispatch } from '../../../../../store/hooks';
import { TransferRecordItemState } from '../../../../../store/slices/transfer_record';
import { getNodeList, getSelectedNode } from '../../../../../store/slices/node_management';
import { selectAddressInfo } from '../../../../../store/slices/address_info';
import { selectLedgerConnection } from '../../../../../store/slices/settings';
import PAGES from '../../../../../constants/pages';
import { getTokenId } from '../../utils/token';
import { setCacheTransferData } from '../../utils/cacheInputTokenAmount';
import { useSendToken } from './sendToken/sendToken';
import { useLedgerSendToken } from './sendToken/ledgerSendToken';
import { callUpdateTransferRecordService } from '../../../../../service/update_transfer_record_service';
import { callAccountsTypeService } from '../../../../../service/accounts_type_service';
import { callOpenSecondaryPopupService } from '../../../../../service/open_secondary_popup_service';
import { callGetLedgerAccountService } from '../../../../../service/get_ledger_account_service';
import { ACCOUNT_TYPE } from '../../../HomePage/constants';
import { LEDGER_LEDGER_LIVE, LEDGER_WEB_HID } from '../../../SettingsPage/constants';
import { setGaEvent } from '../../../../utils/gaUtils';
import { isRiskAsset } from '../../../../utils/assetUtils';
import { ledgerBridgeController } from '../../../../../lib/ledger/bridge';
import useCheckLoginBeforeAction from '../../../../../hooks/check_logion_before_action';
import { updateCheckLedgerImportLoading } from '../../../../../store/slices/notification';

import Toast from '../../../../../components/Toast';

interface State {
  showCostDetail: boolean;
  showRemarksDetail: boolean;

  showTransferLoading: boolean;
  showLedgerLoading: boolean;
  showPrepareConnectLedger: boolean;
  isRiskToken: boolean;
  ledgerTips: string;

  useTrx: string | number;
  trxEnough: boolean;
  createAccountUseTrx: string | number;
  contractUseTrx: string | number;
  costBandwidth: string | number;
  costEnergy: string | number;

  accountIndex: number;
  addressIndex: number;
}

const initialState: State = {
  showCostDetail: false,
  showRemarksDetail: false,
  showTransferLoading: false,
  showLedgerLoading: false,
  showPrepareConnectLedger: false,
  isRiskToken: false,
  ledgerTips: '',

  useTrx: 0,
  trxEnough: true,
  createAccountUseTrx: 0,
  contractUseTrx: 0,
  costBandwidth: 0,
  costEnergy: 0,

  accountIndex: 0,
  addressIndex: 0,
};

type Action =
  | { type: 'SET_SHOW_COST_DETAIL'; payload: boolean }
  | { type: 'SET_SHOW_REMARKS_DETAIL'; payload: boolean }
  | { type: 'SET_SHOW_TRANSFER_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_LEDGER_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_PREPARE_CONNECT_LEDGER'; payload: boolean }
  | { type: 'SET_IS_RISK_TOKEN'; payload: boolean }
  | { type: 'SET_LEDGER_TIPS'; payload: string }
  | {
      type: 'SET_FEE_DETAIL';
      payload: {
        useTrx: string | number;
        trxEnough: boolean;
        createAccountUseTrx: string | number;
        contractUseTrx: string | number;
        costBandwidth: string | number;
        costEnergy: string | number;
      };
    };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_SHOW_COST_DETAIL':
      return {
        ...state,
        showCostDetail: action.payload,
      };
    case 'SET_SHOW_REMARKS_DETAIL':
      return {
        ...state,
        showRemarksDetail: action.payload,
      };
    case 'SET_SHOW_TRANSFER_LOADING':
      return {
        ...state,
        showTransferLoading: action.payload,
      };
    case 'SET_SHOW_LEDGER_LOADING':
      return {
        ...state,
        showLedgerLoading: action.payload,
      };
    case 'SET_SHOW_PREPARE_CONNECT_LEDGER':
      return {
        ...state,
        showPrepareConnectLedger: action.payload,
      };
    case 'SET_LEDGER_TIPS':
      return {
        ...state,
        ledgerTips: action.payload,
      };
    case 'SET_IS_RISK_TOKEN':
      return {
        ...state,
        isRiskToken: action.payload,
      };
    case 'SET_FEE_DETAIL':
      return {
        ...state,
        trxEnough: action.payload.trxEnough,
        useTrx: action.payload.useTrx,
        createAccountUseTrx: action.payload.createAccountUseTrx,
        contractUseTrx: action.payload.contractUseTrx,
        costBandwidth: action.payload.costBandwidth,
        costEnergy: action.payload.costEnergy,
      };

    default:
      return state;
  }
};

let ledgerCancelBack = true;
export const useTransferStep3Biz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const selectedNode = useAppSelector(getSelectedNode);
  const nodeList = useAppSelector(getNodeList) as any;
  const { hostname } = nodeList[selectedNode] ?? {};

  const ledgerConnection = useAppSelector(selectLedgerConnection);

  const appDispatch = useAppDispatch();
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo?.selectedAddress ?? '';

  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const {
    selectedToken,
    selectedCollection,
    fromAddressInfo,
    toAddressInfo,
    transferAmount,
    remarks,
    costs,
    account,
  } = (location.state as any) ?? {};
  const { address: fromAddress } = fromAddressInfo;
  const { address: toAddress } = toAddressInfo;

  const { sendTrx, sendBasicToken, sendSmartToken, sendSmart721Token } = useSendToken();
  const { ledgerSendTrx, ledgerSendBasicToken, ledgerSendSmartToken, ledgerSendSmart721Token } =
    useLedgerSendToken(selectedAddress);

  useEffect(() => {
    setIsRiskToken();

    calculateFeeDetail();

    if (ledgerConnection === LEDGER_LEDGER_LIVE) {
      (async () => {
        try {
          Toast.show({
            icon: 'loading',
            duration: 30000,
          });
          await ledgerBridgeController.waitUntilLoaded();
        } finally {
          Toast.hide();
        }
      })();
    }

    ledgerCancelBack = true;
    return () => {
      ledgerCancelBack = false;
    };
  }, []);

  const getIndex = async () => {
    const ledgerAccount = await callGetLedgerAccountService(msgNode, {});
    const indexObj: { accountIndex: number; addressIndex: number } = _.get(
      ledgerAccount,
      `selected.selectedAccount.addressDetails[${selectedAddress}]`,
      { accountIndex: 0, addressIndex: 0 },
    );

    return indexObj;
  };

  const calculateFeeDetail = async () => {
    let trxEnough = true;
    const createAccountUseTrx = _.get(costs, 'createAccount', 0);
    const contractUseTrx = new BigNumber(_.get(costs, 'bandwidth', 0))
      .plus(_.get(costs, 'useTrxToEnergy', 0))
      .toFixed();

    const trxBalance = new BigNumber(account.balance || 0).shiftedBy(-6);
    const useTrx = new BigNumber(createAccountUseTrx).plus(contractUseTrx).toFixed();
    if (new BigNumber(useTrx).gt(trxBalance)) {
      trxEnough = false;
    }

    dispatch({
      type: 'SET_FEE_DETAIL',
      payload: {
        trxEnough,
        useTrx,
        createAccountUseTrx,
        contractUseTrx,
        costBandwidth: _.get(costs, 'baseBandWidth', 0),
        costEnergy: _.get(costs, 'costEnergy', 0),
      },
    });
  };

  const setIsRiskToken = async () => {
    const isRisk = isRiskAsset(selectedToken);
    dispatch({
      type: 'SET_IS_RISK_TOKEN',
      payload: isRisk,
    });
  };

  const setShowCostDetail = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_COST_DETAIL',
      payload: isShow,
    });
  };

  const setShowRemarksDetail = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_REMARKS_DETAIL',
      payload: isShow,
    });
  };

  const setTransferLoading = (isLoading: boolean) => {
    dispatch({
      type: 'SET_SHOW_TRANSFER_LOADING',
      payload: isLoading,
    });
  };

  const onSend = async () => {
    try {
      const { name, id } = selectedToken;
      setGaEvent('Transfer', 'Click Send', `${name || ''}(${id})`, '', transferAmount);

      setTransferLoading(true);
      const accountsType = await callAccountsTypeService(msgNode);
      const accountType = accountsType[selectedAddress];

      if (accountType === ACCOUNT_TYPE.LEDGER) {
        await handleLedgerAccount();
      } else {
        await handleAccount();
      }
      setGaEvent('Transfer', 'Transfer Success', `Transfer Success`);
      setTransferLoading(false);
    } catch (error) {
      log.info('onSend error', error);
      setGaEvent('Transfer', 'Transfer Fail', `Transfer Fail`);
      setTransferLoading(false);
    }
  };

  const handleAccount = async () => {
    try {
      const { type, precision } = selectedToken;
      const tokenId = getTokenId(selectedToken) ?? '';

      const localRecord = initTransferRecord();

      let res;
      switch (type) {
        case 0:
          res = await sendTrx(
            toAddress,
            new BigNumber(transferAmount).shiftedBy(6).toFixed(0, 1),
            remarks,
          );
          break;
        case 2:
          res = await sendSmartToken(
            toAddress,
            new BigNumber(transferAmount).shiftedBy(precision).toFixed(0, 1),
            tokenId,
            remarks,
          );
          break;
        case 5: {
          const { assetId } = selectedCollection;
          res = await sendSmart721Token(fromAddress, toAddress, assetId, tokenId, remarks);

          localRecord.assetId = assetId;
          break;
        }
        default:
          res = await sendBasicToken(
            toAddress,
            new BigNumber(transferAmount).shiftedBy(precision).toFixed(0, 1),
            tokenId,
            remarks,
          );
      }

      const txId = _.get(res, 'txID');
      Toast.show({
        icon: 'success',
        content: formatMessage({ id: 'SEND.SUCCESS' }),
        duration: 3000,
        afterClose: () => {
          navigate(PAGES.PAGE_BROADCAST, { state: { txId, selectedToken } });
        },
      });

      const timestamp = _.get(res, 'raw_data.timestamp');
      if (txId && timestamp) {
        localRecord.txId = txId;
        localRecord.timestamp = timestamp;
        callUpdateTransferRecordService(msgNode, localRecord);
      }
    } catch (error) {
      Toast.show({
        icon: 'fail',
        content: JSON.stringify(error),
        duration: 3000,
        afterClose: () => {
          navigate(PAGES.PAGE_BROADCAST, { state: { selectedToken } });
        },
      });
      log.info('handleAccount error: ', error);
    }
  };

  const connectHidLedger = async () => {
    await callOpenSecondaryPopupService(msgNode, {
      path: `secondary_popup/secondary_popup.html#${PAGES.PAGE_LEDGER_IMPORT_GUIDE}?from_page=${PAGES.PAGE_TRANSFER_STEP_3}`,
      close: true,
    });

    appDispatch(updateCheckLedgerImportLoading());
  };

  const setShowPrepareConnectLedger = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_PREPARE_CONNECT_LEDGER',
      payload: isShow,
    });
  };

  // check whether is ledger and support ledger hid, open secondary popup
  const prepareConnectLedger = async () => {
    const navigator = window.navigator as any;
    const device = navigator && navigator.hid && (await navigator.hid.getDevices());

    if (device.length <= 0) {
      setShowPrepareConnectLedger(true);
      return false;
    }

    return true;
  };

  const handleLedgerAccount = async () => {
    if (ledgerConnection === LEDGER_WEB_HID) {
      handleLedgerAccountByHID();
    } else {
      handleLedgerAccountByLedgerLive();
    }
  };

  const handleLedgerAccountByHID = async () => {
    const hidConnected = await prepareConnectLedger();
    if (!hidConnected) {
      return;
    }

    const { accountIndex, addressIndex } = await getIndex();
    const { precision, type } = selectedToken;
    const tokenId = getTokenId(selectedToken);
    const localRecord = initTransferRecord();
    setShowLedgerLoading(true);
    let res = {};
    switch (type) {
      case 0:
        res = await ledgerSendTrx(
          toAddress,
          new BigNumber(transferAmount).shiftedBy(6).toFixed(),
          accountIndex,
          addressIndex,
          remarks,
        );
        break;
      case 2:
        res = await ledgerSendSmartToken(
          toAddress,
          new BigNumber(transferAmount).shiftedBy(precision).toFixed(),
          tokenId,
          accountIndex,
          addressIndex,
          remarks,
        );
        break;
      case 5: {
        const { assetId } = selectedCollection;
        res = await ledgerSendSmart721Token(
          toAddress,
          assetId,
          tokenId,
          accountIndex,
          addressIndex,
          remarks,
        );

        localRecord.assetId = assetId;
        break;
      }
      default:
        res = await ledgerSendBasicToken(
          toAddress,
          new BigNumber(transferAmount).shiftedBy(precision).toFixed(),
          tokenId,
          accountIndex,
          addressIndex,
          remarks,
        );
    }
    dealLedgerData(res, localRecord);
  };

  const handleLedgerAccountByLedgerLive = async () => {
    const { accountIndex, addressIndex } = await getIndex();
    const { precision, type, name } = selectedToken;
    const tokenId = getTokenId(selectedToken);
    const localRecord = initTransferRecord();
    setShowLedgerLoading(true);
    let res;
    switch (type) {
      case 0:
        res = await ledgerBridgeController.sendTrxByBridge({
          toAddress,
          fromAddress,
          amount: new BigNumber(transferAmount).shiftedBy(6).toFixed(),
          index: accountIndex,
          addressIndex: addressIndex,
        });
        break;
      case 2:
        res = await ledgerBridgeController.sendTrc20ByBridge({
          id: tokenId,
          toAddress,
          fromAddress,
          amount: new BigNumber(transferAmount).shiftedBy(precision).toFixed(),
          precision,
          TokenName: name,
          index: accountIndex,
          addressIndex: addressIndex,
        });
        break;
      case 5: {
        const { assetId } = selectedCollection;
        res = await ledgerBridgeController.sendTrc721ByBridge({
          id: tokenId,
          toAddress,
          fromAddress,
          amount: assetId,
          decimals: 1,
          TokenName: name,
          index: accountIndex,
          addressIndex: addressIndex,
        });

        localRecord.assetId = assetId;
        break;
      }
      default:
        res = await ledgerBridgeController.sendTrc10ByBridge({
          id: tokenId,
          toAddress,
          fromAddress,
          amount: new BigNumber(transferAmount).shiftedBy(precision).toFixed(),
          index: accountIndex,
          addressIndex: addressIndex,
        });
    }

    dealLedgerData(res, localRecord);
  };

  const dealLedgerData = (res: any, localRecord: TransferRecordItemState) => {
    const selectedAddress = addressInfo?.selectedAddress ?? '';
    setShowLedgerLoading(false);

    if (res.success) {
      const txId = _.get(res, 'signedTransaction.txID');
      const timestamp = _.get(res, 'signedTransaction.raw_data.timestamp');
      if (localRecord && txId && timestamp) {
        localRecord.timestamp = timestamp;
        localRecord.txId = txId;
        callUpdateTransferRecordService(msgNode, localRecord);
      }
      Toast.show({
        icon: 'success',
        content: formatMessage({ id: 'SEND.SUCCESS' }),
        duration: 3000,
        afterClose: () => {
          setGaEvent('Ledger', 'Confirmed Transaction', selectedAddress);
          navigate(PAGES.PAGE_BROADCAST, { state: { txId, selectedToken } });
        },
      });
    } else {
      let id = '';
      let errorStr = res.error.toString();
      if (errorStr === 'User has not unlocked wallet') {
        id = 'CREATION.LEDGER.CONNECT_TIMEOUT';
      } else if (errorStr.match(/denied by the user/)) {
        id = 'CREATION.LEDGER.REJECT';
      } else if (errorStr.match(/U2F TIMEOUT/)) {
        id = 'CREATION.LEDGER.AUTHORIZE_TIMEOUT';
      } else if (errorStr === "Cannot read property 'message' of undefined") {
        id = 'CREATION.LEDGER.NO_TOKEN';
      } else if (errorStr === 'address not match') {
        id = 'CREATION.LEDGER.NOT_MATCH';
      } else if (errorStr.match(/The device is already open/)) {
        id = 'CREATION.LEDGER.NOT_REJECT_LAST';
      }

      if (errorStr.includes('0x6a8b')) {
        setLedgerTips('CREATION.LEDGER.TIP.OPEN_DATA');
        return;
      } else if (errorStr.includes('0x6a8c')) {
        setLedgerTips('CREATION.LEDGER.TIP.OPEN_HASH');
        return;
      } else if (errorStr.includes('0x6a8d')) {
        setLedgerTips('CREATION.LEDGER.TIP.OPEN_CUSTOM');
        return;
      }
      setLedgerTips('');
      Toast.show({
        icon: 'fail',
        content: id ? formatMessage({ id }) : errorStr,
        duration: 3000,
        afterClose: () => {
          setGaEvent('Ledger', 'Rejected Transaction', selectedAddress);
          if (ledgerCancelBack) {
            // save transferData for transfer step 2
            setCacheTransferData({
              inputAmount: transferAmount,
              inputToken: selectedToken,
            });

            navigate(-1);
          }
        },
      });
    }
  };

  const setShowLedgerLoading = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_LEDGER_LOADING',
      payload: isShow,
    });
  };

  const setLedgerTips = (tips: string) => {
    dispatch({
      type: 'SET_LEDGER_TIPS',
      payload: tips,
    });
  };

  const closeLedgerLoadingModal = () => {
    setTransferLoading(false);
    setShowLedgerLoading(false);
    Toast.show({
      icon: 'fail',
      content: formatMessage({ id: 'CREATION.LEDGER.TIP_CANCEL_TRANSACTION' }),
      duration: 3000,
      afterClose: () => {
        // navigate(-1);
      },
    });
  };

  const onCancel = () => {
    // save transferData for transfer step 2
    setCacheTransferData({
      inputAmount: transferAmount,
      inputToken: selectedToken,
    });

    setGaEvent('Transfer', 'Transfer', `Cancel Transfer`);
    navigate(-1);
  };

  const initTransferRecord = () => {
    const { precision, type } = selectedToken;
    const tokenId = getTokenId(selectedToken);
    const transferRecord: TransferRecordItemState = {
      fromAddress,
      toAddress,
      precision,
      tokenId,
      txId: '',
      amount: '',
      timestamp: 0,
      local: true,
    };
    if (type !== 5) {
      transferRecord.amount = new BigNumber(transferAmount).shiftedBy(precision).toFixed();
    }
    return transferRecord;
  };

  const onBackCustomExtraHandle = () => {
    // save transferData for transfer step 2
    setCacheTransferData({
      inputAmount: transferAmount,
      inputToken: selectedToken,
    });

    setGaEvent('Transfer', 'Transfer', `Cancel Transfer`);
  };

  return {
    hostname,
    selectedNode,
    locationState: location.state,
    state,
    setShowCostDetail,
    setShowRemarksDetail,
    closeLedgerLoadingModal,
    setShowPrepareConnectLedger,
    connectHidLedger,
    onSend: useCheckLoginBeforeAction(onSend),
    onCancel,
    onBackCustomExtraHandle,
  };
};
