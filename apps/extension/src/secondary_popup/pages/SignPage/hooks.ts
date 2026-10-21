import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import log from 'loglevel';
import _ from 'lodash';
// @ts-ignore
import TronWeb from 'tronweb';

import { BigNumber } from '../../../popup/utils/numberUtils';
import {
  callConfirmLedgerSignTransactionService,
  callConfirmSignTransactionService,
  callGetConfirmationsService,
  callRejectAllSignTransactionService,
  callRejectSignTransactionService,
} from '../../../service/get_confirmations_service';
import { callGetLedgerAccountService } from '../../../service/get_ledger_account_service';
import { ConfirmationObj, ConfirmationType } from '../../../domain/sign_manager';
import { msgNode } from '../../../popup/inst';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectCheckAuthed,
  selectCheckConfirmations,
  updateCheckLedgerImportLoading,
} from '../../../store/slices/notification';
import { callAccountsTypeService } from '../../../service/accounts_type_service';
import { ACCOUNT_TYPE } from '../../../popup/pages/HomePage/constants';
import { LEDGER_LEDGER_LIVE, LEDGER_WEB_HID } from '../../../popup/pages/SettingsPage/constants';
import { selectLedgerConnection } from '../../../store/slices/settings';
import { ledgerSign } from '../../../lib/ledger/ledger_sign';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import { useSelectedNodeInfo } from '../../../hooks/selected_node_info';

import { LedgerWebHid } from '../../../lib/ledger';
import { ledgerBridgeController } from '../../../lib/ledger/bridge';

import { getSelectedNode } from '../../../store/slices/node_management';
import { selectAddressInfo } from '../../../store/slices/address_info';
import { selectAddressBook } from '../../../store/slices/address_book';
import {
  decodeParams,
  getAbiCode,
  getContractInfo,
  getParamsInfoOfFreezeBalanceContract,
  getParamsInfoOfTransferAssetContract,
  getParamsInfoOfTransferContract,
  getParamsInfoOfTriggerSmartContract,
  getParamsInfoOfUnfreezeBalanceContract,
  getParamsInfoOfVoteWitnessContract,
  getSuperNodeInfo,
  getUnfreezeResource,
  isKnownFunction,
  searchTokenInfo,
} from './utils';
import { getAccountResourcesByAddress } from '../../../popup/utils/assetUtils';
import { setGaEvent } from '../../../popup/utils/gaUtils';
import { signGaStatistics } from './utils/gaReport';

import Toast from '../../../components/Toast';
import {
  CONFIRMATION_TYPE,
  DefaultParamsInfoType,
  FreezeBalanceContractParamsInfoType,
  NormalParamsInfoType,
  TransferAssetContractParamsInfoType,
  TransferContractParamsInfoType,
  TriggerSmartContractParamsInfoType,
  UnFreezeBalanceContractParamsInfoType,
  VoteWitnessContractParamsInfoType,
} from './constants';
import { WindowType } from '../../../constants/types';
import PAGES from '../../../constants/pages';
import { callOpenSecondaryPopupService } from '../../../service/open_secondary_popup_service';
import { IMPORT_GUIDE_PATH } from '../../../hooks/ledger_import_loading';

export type ParamsInfoType =
  | NormalParamsInfoType
  | TriggerSmartContractParamsInfoType
  | TransferContractParamsInfoType
  | TransferAssetContractParamsInfoType
  | VoteWitnessContractParamsInfoType
  | FreezeBalanceContractParamsInfoType
  | UnFreezeBalanceContractParamsInfoType
  | DefaultParamsInfoType
  | Record<string, never>
  | null
  | boolean;

export interface CostsType {
  trxEnough: boolean;
  contractUseTrx: string | number;
  createAccountUseTrx: string | number;
  costBandwidth: string | number;
  costEnergy: string | number;
}

const initCosts = {
  trxEnough: true,
  contractUseTrx: '--',
  createAccountUseTrx: '--',
  costBandwidth: '--',
  costEnergy: '--',
};

interface State {
  confirmations: ConfirmationObj[];
  selectedIndex: number;
  tabIndex: number;

  showLedgerLoading: boolean;
  showPrepareConnectLedger: boolean;
  paramsInfo: ParamsInfoType;
  costs: CostsType;
  allTokenList: Array<any>;
  riskTokens: Array<any>;
  ledgerTips: string;
  showApproveAddressModal: boolean;
}

const initialState: State = {
  confirmations: [],
  selectedIndex: 0,
  tabIndex: 0,
  showLedgerLoading: false,
  showPrepareConnectLedger: false,
  paramsInfo: null,
  costs: { ...initCosts },
  allTokenList: [],
  riskTokens: [],
  ledgerTips: '',
  showApproveAddressModal: false,
};

type Action =
  | {
      type: 'SET_CONFIRMATIONS';
      payload: ConfirmationObj[];
    }
  | {
      type: 'SELECT_PREVIOUS';
    }
  | {
      type: 'SELECT_NEXT';
    }
  | { type: 'CHANGE_TAB'; payload: number }
  | { type: 'SET_SHOW_LEDGER_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_PREPARE_CONNECT_LEDGER'; payload: boolean }
  | {
      type: 'SET_PARAMS_INFO';
      payload: ParamsInfoType;
    }
  | {
      type: 'SET_COSTS';
      payload: CostsType;
    }
  | {
      type: 'SET_ALL_TOKEN_LIST';
      payload: Array<any>;
    }
  | {
      type: 'SET_RISK_TOKENS';
      payload: Array<any>;
    }
  | { type: 'SET_LEDGER_TIPS'; payload: string }
  | { type: 'SET_SHOW_APPROVE_ADDRESS_MODAL'; payload: boolean };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_CONFIRMATIONS': {
      const confirmations = action.payload;
      if (confirmations.length == 0) {
        return {
          ...state,
          confirmations: [],
        };
      }

      let newIndex;
      if (state.selectedIndex >= confirmations.length) {
        newIndex = confirmations.length - 1;
      } else if (state.selectedIndex - 1 >= 0) {
        newIndex = state.selectedIndex - 1;
      } else {
        newIndex = state.selectedIndex;
      }
      return {
        ...state,
        confirmations: action.payload,
        selectedIndex: newIndex,
      };
    }
    case 'SELECT_PREVIOUS':
      return {
        ...state,
        selectedIndex: state.selectedIndex - 1 < 0 ? 0 : state.selectedIndex - 1,
      };
    case 'SELECT_NEXT':
      return {
        ...state,
        selectedIndex:
          state.selectedIndex + 1 >= state.confirmations.length
            ? state.confirmations.length - 1
            : state.selectedIndex + 1,
      };
    case 'CHANGE_TAB':
      return {
        ...state,
        tabIndex: action.payload,
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
    case 'SET_PARAMS_INFO':
      return {
        ...state,
        paramsInfo: { ...action.payload },
      };
    case 'SET_COSTS':
      return {
        ...state,
        costs: { ...initCosts, ...action.payload },
      };
    case 'SET_ALL_TOKEN_LIST':
      return {
        ...state,
        allTokenList: action.payload,
      };
    case 'SET_RISK_TOKENS':
      return {
        ...state,
        riskTokens: action.payload,
      };
    case 'SET_LEDGER_TIPS':
      return {
        ...state,
        ledgerTips: action.payload,
      };
    case 'SET_SHOW_APPROVE_ADDRESS_MODAL':
      return {
        ...state,
        showApproveAddressModal: action.payload,
      };
    default:
      return state;
  }
};

export interface SignPageProps {
  windowType: WindowType;
}

export const useSignBiz = ({ windowType }: SignPageProps) => {
  useCheckSignPageAuthed(windowType);
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const appDispatch = useAppDispatch();

  const [state, dispatch] = useReducer(reducer, initialState);
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo.selectedAddress;
  const selectedAddressItem = addressInfo?.addressItems[selectedAddress];

  const selectedNode = useAppSelector(getSelectedNode);

  const checkConfirmations = useAppSelector(selectCheckConfirmations);

  const ledgerConnection = useAppSelector(selectLedgerConnection);

  const { tronWebInstance } = useTronWebInstance();

  const { selectedNodeInfo } = useSelectedNodeInfo();
  const { chain } = selectedNodeInfo;
  let tronWebChainInstance = tronWebInstance;
  if (chain !== '_') {
    tronWebChainInstance = tronWebInstance.sidechain;
  }
  const addressBooks = useAppSelector(selectAddressBook);

  const selectPrevious = useCallback(() => {
    dispatch({ type: 'SELECT_PREVIOUS' });
  }, []);

  const selectNext = useCallback(() => {
    dispatch({ type: 'SELECT_NEXT' });
  }, []);

  const currentConfirmation = useMemo(() => {
    if (state.confirmations.length == 0) {
      return undefined;
    }
    return state.confirmations[state.selectedIndex];
  }, [state.confirmations, state.selectedIndex]);

  const initialGaReport = () => {
    if (!currentConfirmation || currentConfirmation.type === ConfirmationType.STRING) return;
    const { input, hostname } = currentConfirmation;
    setGaEvent(
      'Authorize',
      'Sign Authorize',
      'Sign Authorize',
      /^(http|https):\/\//.test(hostname) || !hostname ? hostname : `http://${hostname}`,
      (input && input.call_value) || 0,
    );
  };

  // initialized
  useEffect(() => {
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beforeUnload = useCallback(() => {
    if (!currentConfirmation) return;
    rejectSignDelay(currentConfirmation, state.selectedIndex);
  }, [currentConfirmation, state.selectedIndex]);

  useEffect(() => {
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [beforeUnload]);

  useEffect(() => {
    (async () => {
      await setConfirmations();
    })();
  }, [checkConfirmations]);

  const [hasGaReport, setHasGaReport] = useState<boolean>(false);
  useEffect(() => {
    if (!currentConfirmation || hasGaReport) return; // only report once
    initialGaReport();
    setHasGaReport(true);
  }, [currentConfirmation]);

  const setConfirmations = async () => {
    const { confirmations } = await callGetConfirmationsService(msgNode);
    dispatch({ type: 'SET_CONFIRMATIONS', payload: confirmations });
  };

  const changeTab = useCallback((tabIndex: number) => {
    dispatch({ type: 'CHANGE_TAB', payload: tabIndex });
  }, []);

  const gaReport = ({
    confirmation,
    signedTransaction = {},
  }: {
    confirmation: ConfirmationObj;
    signedTransaction: any;
  }) => {
    if (confirmation.type === ConfirmationType.STRING) return;
    const { input, unSignedTransaction, hostname, data } = confirmation;
    const contractType = unSignedTransaction.raw_data.contract[0].type;
    const contractAddress = TronWeb.address.fromHex(input.contract_address);
    signGaStatistics(contractType, contractAddress, hostname, data, signedTransaction);
  };

  const setShowApproveAddressModal = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_APPROVE_ADDRESS_MODAL',
      payload: isShow,
    });
  };

  const secondConfirmApproveAddress = () => {
    const { paramsInfo, showApproveAddressModal } = state;
    const { contractInfo, functionName } = paramsInfo;
    const isContract = _.get(contractInfo, 'isContract', '');
    if (functionName === 'approve' && !isContract && !showApproveAddressModal) {
      setShowApproveAddressModal(true);
      return true;
    }

    setShowApproveAddressModal(false);
    return false;
  };

  const confirmSign = async (confirmation: ConfirmationObj, selectedIndex: number) => {
    try {
      const disableApprove = secondConfirmApproveAddress();
      if (disableApprove) {
        return;
      }

      const accountsType = await callAccountsTypeService(msgNode);
      const accountType = accountsType[selectedAddress];
      if (accountType === ACCOUNT_TYPE.LEDGER) {
        await handleLedgerConfirmSign(selectedIndex);
        // ledger ga report is in function "handleLedgerConfirmSign"
      } else {
        const res = await callConfirmSignTransactionService(msgNode, {
          confirmation,
          selectedIndex,
        });
        const { signedTransaction } = res;
        gaReport({ confirmation, signedTransaction });
      }
    } catch (error) {
      log.error('confirmSign error: ', confirmSign);
    }
  };

  const rejectSign = async (confirmation: ConfirmationObj, selectedIndex: number) => {
    await callRejectSignTransactionService(msgNode, { confirmation, selectedIndex });
  };

  const rejectSignDelay = async (confirmation: ConfirmationObj, selectedIndex: number) => {
    await callRejectSignTransactionService(msgNode, { confirmation, selectedIndex, delay: true });
  };

  const rejectAllSign = async () => {
    await callRejectAllSignTransactionService(msgNode);
  };

  const handleLedgerConfirmSign = async (selectedIndex: number) => {
    try {
      if (!currentConfirmation) {
        return;
      }

      if (ledgerConnection === LEDGER_WEB_HID) {
        const hidConnected = await prepareConnectLedger();
        if (!hidConnected) {
          return;
        }
      }

      setShowLedgerLoading(true);

      const ledgerAccount = await callGetLedgerAccountService(msgNode, {});
      const { accountIndex, addressIndex } = ledgerAccount?.selected?.selectedAccount
        ?.addressDetails[selectedAddress] ?? { accountIndex: 0, addressIndex: 0 };

      if (!(await isCorrectAddress(selectedAddress, accountIndex, addressIndex))) {
        return {
          success: false,
          error: 'check ledger address failed',
        };
      }

      const {
        success,
        error = '',
        signedTransaction,
      } = await ledgerSignTransactionMulti({
        transaction: currentConfirmation.unSignedTransaction,
        index: accountIndex,
        fromAddress: selectedAddress,
        addressIndex: addressIndex,
      });

      if (success) {
        setShowLedgerLoading(false);
        gaReport({ confirmation: currentConfirmation, signedTransaction });
        callConfirmLedgerSignTransactionService(msgNode, { signedTransaction, selectedIndex });
      } else {
        let id = '';
        if (error === 'User has not unlocked wallet') {
          id = 'CREATION.LEDGER.CONNECT_TIMEOUT';
        } else if (error.match(/denied by the user/)) {
          id = 'CREATION.LEDGER.REJECT';
        } else if (error.match(/U2F TIMEOUT/)) {
          id = 'CREATION.LEDGER.AUTHORIZE_TIMEOUT';
        } else if (error === "Cannot read property 'message' of undefined") {
          id = 'CREATION.LEDGER.NO_TOKEN';
        } else if (error === 'address not match') {
          id = 'CREATION.LEDGER.NOT_MATCH';
        }
        if (error.toString().includes('0x6a8b')) {
          setLedgerTips('CREATION.LEDGER.TIP.OPEN_DATA');
          return;
        } else if (error.toString().includes('0x6a8c')) {
          setLedgerTips('CREATION.LEDGER.TIP.OPEN_HASH');
          return;
        } else if (error.toString().includes('0x6a8d')) {
          setLedgerTips('CREATION.LEDGER.TIP.OPEN_CUSTOM');
          return;
        }
        setShowLedgerLoading(false);
        Toast.show({
          icon: 'fail',
          content: id ? formatMessage({ id }) : error,
          duration: 3000,
        });
      }
    } catch (error) {
      log.error('handleLedgerConfirmSign error: ', error);
    }
  };

  const ledgerSignTransactionMulti = async (params: any) => {
    if (ledgerConnection === LEDGER_WEB_HID) {
      return await ledgerSignTransactionMultiByHID(params);
    } else {
      return await ledgerSignTransactionMultiByLedgerLive(params);
    }
  };

  const ledgerSignTransactionMultiByHID = async (params: any) => {
    try {
      const { index, transaction, addressIndex } = params;
      if (transaction !== undefined) {
        const signedTransaction = await ledgerSign(
          transaction,
          index,
          addressIndex,
          tronWebChainInstance,
        );

        if (signedTransaction.hasOwnProperty('result') && !signedTransaction.result) {
          return {
            success: false,
            error: signedTransaction.error,
          };
        } else {
          return {
            success: true,
            signedTransaction,
            error: null,
          };
        }
      } else {
        return {
          success: false,
          error: 'transaction is invalid',
        };
      }
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  };

  const ledgerSignTransactionMultiByLedgerLive = async (params: any): Promise<any> => {
    try {
      const { fromAddress, index, transaction, addressIndex } = params;
      if (transaction !== undefined) {
        return await ledgerBridgeController.signTransactionMulti({
          transaction,
          index,
          fromAddress,
          addressIndex,
        });
      } else {
        return {
          success: false,
          error: 'transaction is invalid',
        };
      }
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  };

  // check address is ledger and support ledger hid, open secondary popup
  const prepareConnectLedger = async () => {
    const navigator = window.navigator as any;
    const device = navigator && navigator.hid && (await navigator.hid.getDevices());

    if (ledgerConnection === LEDGER_WEB_HID && device && device.length <= 0) {
      setShowPrepareConnectLedger(true);
      return false;
    }

    return true;
  };

  const setShowLedgerLoading = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_LEDGER_LOADING',
      payload: isShow,
    });
  };

  const setShowPrepareConnectLedger = (isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_PREPARE_CONNECT_LEDGER',
      payload: isShow,
    });
  };

  const isCorrectAddress = async (fromAddress: string, index: number, addressIndex: number) => {
    try {
      let targetAddress;
      if (ledgerConnection === LEDGER_WEB_HID) {
        targetAddress = await new LedgerWebHid().getAddressByDefinePath(
          getPath(index, addressIndex),
        );
      } else {
        targetAddress = await ledgerBridgeController.getLedgerAccountByDefinePath(
          index,
          addressIndex,
        );
      }
      if (targetAddress !== fromAddress) {
        return false;
      }

      return true;
    } catch (error) {
      log.error('isCorrectAddress error: ', error);
    }
  };

  const getPath = (index = 0, addressIndex = 0) => {
    return "44'/195'/" + index + "'/0/" + addressIndex;
  };

  const calcFee = async (paramsInfo: ParamsInfoType, confirmation: ConfirmationObj) => {
    try {
      const { unSignedTransaction } = confirmation;
      let contractType;
      let energyUsed = 0;
      if (confirmation.type == ConfirmationType.TRANSACTION) {
        contractType = confirmation.contractType;
        energyUsed = confirmation.energyUsed;
      }

      const chainParameters = _.keyBy(await tronWebInstance.trx.getChainParameters(), 'key');

      const rawDataHex = _.get(unSignedTransaction, 'raw_data_hex', '');

      // calculate fee
      const createNewAccountFeeInSystemContract = _.get(
        chainParameters,
        'getCreateNewAccountFeeInSystemContract.value',
        0,
      );
      const createAccountFee = _.get(chainParameters, 'getCreateAccountFee.value', 0);
      const bandwidthFee = _.get(chainParameters, 'getTransactionFee.value', 1000);
      const energyFee = _.get(chainParameters, 'getEnergyFee.value', 420);
      const bandwidth = new BigNumber(Buffer.byteLength(_.toString(rawDataHex), 'hex'))
        .plus(134)
        .toNumber();

      let costBandwidth = 0;
      let costEnergy = 0;
      let createAccountUseTrx = 0;
      let contractUseTrx = 0;

      const res = await getAccountResourcesByAddress(tronWebInstance, selectedAddress);
      const addressResource = res.data;

      if (contractType && ['TransferContract', 'TransferAssetContract'].includes(contractType)) {
        const toAddress = _.get(paramsInfo, 'toAddress');
        const account = await tronWebInstance.trx.getUnconfirmedAccount(toAddress);
        if (!account.address) {
          const useBandWidth =
            addressResource.netLimit -
              (addressResource.freeNetLimit || 0) -
              addressResource.NetUsedOnly >=
            200;
          if (useBandWidth && createNewAccountFeeInSystemContract === 0) {
            createAccountUseTrx = 0;
          } else {
            const createNewAccountFee = new BigNumber(createNewAccountFeeInSystemContract);
            createAccountUseTrx = useBandWidth
              ? createNewAccountFee.shiftedBy(-6).toNumber()
              : createNewAccountFee.plus(createAccountFee).shiftedBy(-6).toNumber();
          }
        }
      }
      // bandwidth
      if (addressResource.netLimit - addressResource.netUsed - bandwidth < 0) {
        contractUseTrx = new BigNumber(bandwidth)
          .multipliedBy(bandwidthFee)
          .shiftedBy(-6)
          .toNumber();
      } else {
        costBandwidth = bandwidth;
      }

      // energy
      const restEnergy = new BigNumber(addressResource.energy || 0)
        .plus(-(addressResource.energyUsed || 0))
        .toNumber();
      if (restEnergy - energyUsed < 0) {
        costEnergy = restEnergy;
        contractUseTrx += new BigNumber(energyUsed)
          .plus(-restEnergy)
          .multipliedBy(energyFee)
          .shiftedBy(-6)
          .toNumber();
      } else {
        costEnergy = energyUsed;
      }

      // check balance
      let trxEnough = true;
      let trxBalance = await tronWebInstance.trx.getBalance(selectedAddress);
      trxBalance = new BigNumber(trxBalance || 0).shiftedBy(-6);
      if (new BigNumber(createAccountUseTrx).plus(contractUseTrx).gt(trxBalance)) {
        trxEnough = false;
      }
      dispatch({
        type: 'SET_COSTS',
        payload: {
          trxEnough,
          contractUseTrx: contractUseTrx,
          createAccountUseTrx: createAccountUseTrx,
          costBandwidth: costBandwidth,
          costEnergy: costEnergy,
        },
      });
    } catch (e) {
      console.error('calculate fee error: ', e);

      dispatch({
        type: 'SET_COSTS',
        payload: {
          ...initCosts,
        },
      });
    }
  };

  const getTokenInfo = async (paramsInfo, tokenId, type: number, assetId = false) => {
    const tokenInfo = await searchTokenInfo(tokenId, selectedAddress, selectedNode, type, assetId);
    paramsInfo.tokenInfo = tokenInfo;
    dispatch({
      type: 'SET_PARAMS_INFO',
      payload: paramsInfo,
    });
  };

  const getApproveContractInfo = async (paramsInfo) => {
    const contractInfo = await getContractInfo(
      selectedAddress,
      paramsInfo?.toAddress,
      tronWebInstance,
    );
    paramsInfo.contractInfo = contractInfo;
    dispatch({
      type: 'SET_PARAMS_INFO',
      payload: paramsInfo,
    });
  };

  const getArgs = async (paramsInfo: any, parameter: any, function_selector: string) => {
    try {
      if (paramsInfo?.contractAddress) {
        const abi = await getAbiCode(paramsInfo?.contractAddress, tronWebInstance);
        const args = decodeParams(parameter, abi, function_selector);
        paramsInfo.args = args;
        dispatch({
          type: 'SET_PARAMS_INFO',
          payload: paramsInfo,
        });
      }
    } catch (e) {
      log.error('getArgs', e);
    }
  };

  const setParamsInfo = (paramsInfo) => {
    dispatch({
      type: 'SET_PARAMS_INFO',
      payload: paramsInfo,
    });
  };

  const getSuperNodeHooks = async (paramsInfo, votes) => {
    try {
      const superNodeInfo = await getSuperNodeInfo(selectedAddress, votes);
      let voteCount = new BigNumber(0);
      superNodeInfo.forEach((item) => {
        voteCount = voteCount.plus(item.voteCount);
      });
      paramsInfo.superNodeInfo = superNodeInfo;
      paramsInfo.amount = voteCount;
      setParamsInfo(paramsInfo);
    } catch (e) {
      log.error(e);
    }
  };

  const getUnfreezeResourceHooks = async (paramsInfo) => {
    try {
      const { fromAddress, toAddress, resource } = paramsInfo;
      const type = fromAddress === toAddress ? 1 : 2;
      const sourceType = resource === 'BANDWIDTH' ? 1 : 2;
      const unfreezeBalance = await getUnfreezeResource(
        fromAddress,
        type,
        sourceType,
        toAddress,
        tronWebInstance,
      );
      paramsInfo.unfreezeBalance = unfreezeBalance;
      setParamsInfo(paramsInfo);
    } catch (e) {
      log.error(e);
    }
  };

  useEffect(() => {
    const func = async () => {
      dispatch({
        type: 'CHANGE_TAB',
        payload: 0,
      });
      if (!currentConfirmation) {
        return;
      }

      const { input, type, contractType, unSignedTransaction } = currentConfirmation;
      if (type === CONFIRMATION_TYPE.STRING) {
        setParamsInfo({});
        return;
      }
      const { parameter, contract_address, function_selector, votes } = input;

      const rawDataHex = unSignedTransaction?.raw_data_hex || '';
      let paramsInfo: ParamsInfoType = false;
      let contractAddress;
      if (type === CONFIRMATION_TYPE.TRANSACTION) {
        switch (contractType) {
          case 'TriggerSmartContract':
            contractAddress = TronWeb.address.fromHex(contract_address);
            paramsInfo = await getParamsInfoOfTriggerSmartContract({
              input,
              rawDataHex,
              selectedAddress,
              selectedAddressItem,
              selectedNode,
              addressBooks,
            });
            setParamsInfo(paramsInfo);
            getTokenInfo(
              paramsInfo,
              String(contractAddress),
              -1,
              _.get(paramsInfo?.args, '2.value', 0),
            );
            if (paramsInfo?.functionName === 'approve') {
              getApproveContractInfo(paramsInfo);
            }
            if (!isKnownFunction(paramsInfo?.functionName) && !isKnownFunction(function_selector)) {
              getArgs(paramsInfo, parameter, function_selector);
            }
            break;
          case 'TransferContract':
            paramsInfo = await getParamsInfoOfTransferContract({
              input,
              contractType,
              rawDataHex,
              selectedAddressItem,
              addressBooks,
            });
            setParamsInfo(paramsInfo);
            break;
          case 'TransferAssetContract':
            paramsInfo = await getParamsInfoOfTransferAssetContract({
              input,
              contractType,
              rawDataHex,
              selectedAddressItem,
              addressBooks,
            });
            setParamsInfo(paramsInfo);
            getTokenInfo(paramsInfo, paramsInfo?.tokenId, 1);
            break;
          case 'VoteWitnessContract':
            paramsInfo = await getParamsInfoOfVoteWitnessContract(input, rawDataHex);
            setParamsInfo(paramsInfo);
            await getSuperNodeHooks(paramsInfo, votes);
            break;
          case 'FreezeBalanceContract':
            paramsInfo = await getParamsInfoOfFreezeBalanceContract({
              input,
              rawDataHex,
              selectedAddressItem,
              addressBooks,
            });
            setParamsInfo(paramsInfo);
            break;
          case 'UnfreezeBalanceContract':
            paramsInfo = await getParamsInfoOfUnfreezeBalanceContract({
              input,
              rawDataHex,
              addressBooks,
            });
            setParamsInfo(paramsInfo);
            await getUnfreezeResourceHooks(paramsInfo);
            break;
          default:
            paramsInfo = {
              contractType,
              rawDataHex,
            };
            setParamsInfo(paramsInfo);
            break;
        }
      }
      calcFee(paramsInfo, currentConfirmation);
    };
    func();
  }, [currentConfirmation]);

  const setLedgerTips = (tips: string) => {
    dispatch({
      type: 'SET_LEDGER_TIPS',
      payload: tips,
    });
  };

  const onConfirmOpenLedgerGuide = useCallback(async () => {
    setShowPrepareConnectLedger(false);
    if (windowType == WindowType.SECONDARY) {
      navigate(PAGES.PAGE_LEDGER_IMPORT_GUIDE);
    } else if (windowType == WindowType.POPUP) {
      await callOpenSecondaryPopupService(msgNode, {
        path: IMPORT_GUIDE_PATH + '?from_page=' + PAGES.PAGE_SIGN,
        close: true,
      });
      appDispatch(updateCheckLedgerImportLoading());
    }
  }, [windowType]);

  return {
    state,
    currentConfirmation,
    selectPrevious,
    selectNext,

    selectedAddressItem,
    selectedNode,

    changeTab,
    confirmSign,
    rejectSign,
    rejectAllSign,

    setShowLedgerLoading,
    setShowPrepareConnectLedger,
    onConfirmOpenLedgerGuide,
    setShowApproveAddressModal,
  };
};

const useCheckSignPageAuthed = (windowType: WindowType) => {
  const navigate = useNavigate();
  const checkAuthed = useAppSelector(selectCheckAuthed);

  useEffect(() => {
    (async () => {
      const { confirmations } = await callGetConfirmationsService(msgNode);
      if (confirmations && !confirmations.length) {
        if (windowType === WindowType.POPUP) {
          navigate(PAGES.PAGE_HOMEPAGE);
        } else if (windowType === WindowType.SECONDARY) {
          window.close();
        }
      }
    })();
  }, [checkAuthed]);
};
