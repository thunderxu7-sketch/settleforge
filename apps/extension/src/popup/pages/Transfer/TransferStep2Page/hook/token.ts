import _ from 'lodash';
import log from 'loglevel';
import { useLocation } from 'react-router';
import { useIntl } from 'react-intl';
import { useCallback, useEffect, useReducer } from 'react';

import { usePricesInfo } from '../../../../../hooks/prices_info';
import { useTronWebInstance } from '../../../../../hooks/tronweb_popup';
import { useAppSelector } from '../../../../../store/hooks';
import { selectAddressInfo } from '../../../../../store/slices/address_info';
import { getSelectedNode } from '../../../../../store/slices/node_management';
import { resourceManager } from '../../../../../domain/resource_manager';
import { searchTokens } from '../../../../../service/local_data_service';
import { getAllLocalTokens, getTokenId, isCustomToken } from '../../utils/token';
import { getCacheTransferData, setCacheTransferData } from '../../utils/cacheInputTokenAmount';
import { setGaEvent } from '../../../../utils/gaUtils';
import { getAccountResourcesByAddress, isRiskAsset } from '../../../../utils/assetUtils';
import { useTriggerConstantContract } from '../../../../utils/triggerConstantContract';
import { BigNumber, numberParser, formatNumber } from '../../../../utils/numberUtils';
import { AssetItemType, AssetType } from '../../../../../constants/types';
import { FRONT_API_TIME_OUT } from '../../../../../constants/api';
import Toast from '../../../../../components/Toast';

export interface Costs {
  baseBandWidth: number | string;
  bandwidth: number;
  energy: number;
  createAccount: number | string;
  useTrxToEnergy: number;
  costEnergy: number;
}

export interface State {
  selectedToken: AssetItemType;
  tokenStatus: string;
  tokenTips: string;
  tokenAmount: string;
  tokenValue: string;

  allTokenList: AssetType;
  showTokenSelect: boolean;
  amountStatus: string;
  amountTips: string;

  costs: Costs;

  remarks: string;
  showRemarks: boolean;
  showModal: boolean;

  account: any;
  chainParameters: any;
  addressResource: any;

  tokenSearchKey: string;
  tokenFilterCondition: number;
}

const initialState: State = {
  // @ts-ignore
  selectedToken: {},
  tokenStatus: '',
  tokenTips: '',
  tokenAmount: '',
  tokenValue: '',

  allTokenList: [],
  showTokenSelect: false,

  amountStatus: '',
  amountTips: '',

  costs: {
    baseBandWidth: 0,
    bandwidth: 0,
    energy: 0,
    createAccount: 0,
    useTrxToEnergy: 0,
    costEnergy: 0,
  },

  remarks: '',
  showRemarks: false,
  showModal: false,

  // cache result to avoid call local chain data too often
  account: {},
  chainParameters: {},
  addressResource: {},

  tokenSearchKey: '',
  tokenFilterCondition: 0,
};

type Action =
  | { type: 'CHECK_TOKEN'; payload: { status: string; tips: string } }
  | { type: 'CHECK_TOKEN_AMOUNT'; payload: { status: string; tips: string } }
  | { type: 'SET_SELECTED_TOKEN'; payload: AssetItemType }
  | { type: 'SET_ALL_TOKEN_LIST'; payload: AssetType }
  | {
      type: 'SET_TOKEN_AMOUNT';
      payload: { amount: string; tokenValue: string };
    }
  | { type: 'SET_SHOW_REMARKS'; payload: boolean }
  | { type: 'SET_REMARKS'; payload: string }
  | { type: 'SET_SHOW_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_TOKEN_SELECT'; payload: boolean }
  | { type: 'UPDATE_COSTS'; payload: Costs }
  | { type: 'UPDATE_ACCOUNT'; payload: any }
  | { type: 'UPDATE_CHAIN_PARAMETERS'; payload: any }
  | { type: 'UPDATE_ADDRESS_RESOURCE'; payload: any }
  | { type: 'SET_TOKEN_SEARCH_KEY'; payload: string }
  | { type: 'SET_TOKEN_FILTER_CONDITION'; payload: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'CHECK_TOKEN':
      return {
        ...state,
        tokenStatus: action.payload.status,
        tokenTips: action.payload.tips,
      };
    case 'CHECK_TOKEN_AMOUNT':
      return {
        ...state,
        amountStatus: action.payload.status,
        amountTips: action.payload.tips,
      };
    case 'SET_SELECTED_TOKEN':
      return {
        ...state,
        selectedToken: action.payload,
      };
    case 'SET_SHOW_TOKEN_SELECT':
      return {
        ...state,
        showTokenSelect: action.payload,
      };
    case 'SET_ALL_TOKEN_LIST':
      return {
        ...state,
        allTokenList: action.payload,
      };
    case 'SET_TOKEN_AMOUNT':
      return {
        ...state,
        tokenAmount: action.payload.amount,
        tokenValue: action.payload.tokenValue,
      };
    case 'SET_SHOW_REMARKS':
      return {
        ...state,
        showRemarks: action.payload,
      };
    case 'SET_REMARKS':
      return {
        ...state,
        remarks: action.payload,
      };
    case 'SET_SHOW_MODAL':
      return {
        ...state,
        showModal: action.payload,
      };
    case 'UPDATE_COSTS':
      return {
        ...state,
        costs: action.payload,
      };
    case 'UPDATE_CHAIN_PARAMETERS':
      return {
        ...state,
        chainParameters: action.payload,
      };
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        account: action.payload,
      };
    case 'UPDATE_ADDRESS_RESOURCE':
      return {
        ...state,
        addressResource: action.payload,
      };
    case 'SET_TOKEN_SEARCH_KEY':
      return {
        ...state,
        tokenSearchKey: action.payload,
      };
    case 'SET_TOKEN_FILTER_CONDITION':
      return {
        ...state,
        tokenFilterCondition: action.payload,
      };
    default:
      return state;
  }
};

let checkAmountHasNextTurn = false;
export const useTransferStep2TokenBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { formatMessage } = useIntl();
  const location = useLocation();
  const { receiverAddress, selectedToken: routeToken } = (location.state as any) ?? {};

  const { tronWebInstance } = useTronWebInstance();

  // useSaveLatestLocation();

  const { pricesInfo } = usePricesInfo();
  const { selected: currency } = pricesInfo;
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedNode = useAppSelector(getSelectedNode);
  const selectedAddress = addressInfo?.selectedAddress ?? '';

  const { triggerConstantContract } = useTriggerConstantContract();

  useEffect(() => {
    getAllTokenList();

    let defaultToken = routeToken;
    // rewrite last token if it's from step 3 back
    const { inputToken } = getCacheTransferData();
    if (Object.keys(inputToken).length > 0) {
      defaultToken = inputToken;
    }
    setSelectedToken(defaultToken);

    (async () => {
      // update local asset data
      await resourceManager.setAllAssetList(selectedAddress, selectedNode);
      getAllTokenList();

      await resourceManager.getResourceInfoFromStorage();
    })();
  }, []);

  useEffect(() => {
    getAllTokenList();
  }, [state.tokenSearchKey, state.tokenFilterCondition]);

  useEffect(() => {
    if (Object.keys(state.selectedToken).length > 0) {
      checkToken();

      let defaultAmount = '';
      // rewrite last amount if it's from step 3 back
      const { inputAmount } = getCacheTransferData();
      if (inputAmount) {
        defaultAmount = inputAmount.toString();
        setCacheTransferData({
          inputAmount: 0,
          inputToken: {},
        });
      }
      setTokenAmount(defaultAmount, '');
    }
  }, [state.selectedToken]);

  useEffect(() => {
    if (state.tokenAmount && state.selectedToken?.type !== 5) {
      checkTokenAmount();
    }
  }, [state.tokenAmount, state.remarks, state.selectedToken]);

  const checkToken = async () => {
    try {
      let status = '';
      let tips = '';
      const { tokenStatus, type, transferStatus } = state.selectedToken;

      if (isCustomToken(tokenStatus)) {
        if (!transferStatus) {
          status = 'error';
          tips = 'ACCOUNT.SEND.TIPS_TOKEN_LOSE_FUNC';
        }
        dispatch({
          type: 'CHECK_TOKEN',
          payload: { status, tips },
        });
        return;
      }

      if (Number(type) === 2) {
        status = 'info';
        tips = 'WARN.SEND.TRC20_TOKEN_WARN';
      } else if (Number(type) === 5) {
        status = 'info';
        tips = 'WARN.SEND.TRC721_TOKEN_WARN';
      }

      const isRisk = isRiskAsset(state.selectedToken);
      if (isRisk) {
        status = 'warn';
        tips = 'ACCOUNT.SEND.TIPS_TOKEN_IS_CHEAT';
      }

      dispatch({
        type: 'CHECK_TOKEN',
        payload: { status, tips },
      });
    } catch (error) {
      log.info('checkToken error: ', error);
    }
  };

  const setSelectedToken = async (selectedToken: AssetItemType) => {
    if (selectedToken && Object.keys(selectedToken).length > 0) {
      if (selectedToken.type === 0) {
        selectedToken.price = 1;
        selectedToken.precision = 6;
        selectedToken.name = 'TRX';
        selectedToken.shortName = 'TRX';
      }

      dispatch({
        type: 'SET_SELECTED_TOKEN',
        payload: selectedToken,
      });
    } else {
      const allTokenList = (await getAllLocalTokens(selectedAddress, selectedNode)) as any[];
      const trxData = allTokenList.find(({ type }) => {
        return type === 0;
      });
      dispatch({
        type: 'SET_SELECTED_TOKEN',
        payload: trxData,
      });
    }
    setGaEvent('Transfer', 'Click choose token', 'Click choose token');
  };

  const setShowTokenSelect = useCallback((isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_TOKEN_SELECT',
      payload: isShow,
    });
  }, []);

  const getAllTokenList = async () => {
    try {
      const searchKey = state.tokenSearchKey.trim();
      const filterCondition = state.tokenFilterCondition;
      let allTokenList;
      if (searchKey.length <= 0) {
        allTokenList = (await getAllLocalTokens(selectedAddress, selectedNode)) as any[];
      } else {
        allTokenList = (await getAllTokensBySearchKey(
          selectedAddress,
          searchKey,
          filterCondition,
        )) as any[];
      }

      allTokenList.map((item) => {
        if (item.type === 0) {
          item.price = 1;
          item.precision = 6;
          item.name = 'TRX';
          item.shortName = 'TRX';
        }
      });

      dispatch({
        type: 'SET_ALL_TOKEN_LIST',
        payload: allTokenList,
      });
    } catch (error) {
      log.info('getAllTokenList error: ', error);
    }
  };

  const getAllTokensBySearchKey = async (
    selectedAddress: string,
    searchKey: string,
    type: number,
  ) => {
    let result: AssetType = [];
    try {
      const { success, data, error } = (await searchTokens(
        selectedAddress,
        searchKey,
        0,
        100,
        type,
      )) as any;

      if (!success) {
        error && error.indexOf(FRONT_API_TIME_OUT) !== -1
          ? Toast.show({
              icon: 'fail',
              content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
              duration: 3000,
            })
          : Toast.hide();
        return;
      }

      result = [...result, ...data.token];
      return result;
    } catch (error) {
      log.info('getAllTokensBySearchKey error: ', error);
      return result;
    }
  };

  const getAccountInfo = async (address: string) => {
    try {
      const { account: accountInfo } = state;
      if (accountInfo && accountInfo[address] && Object.keys(accountInfo[address]).length !== 0) {
        return accountInfo[address];
      }

      const account = (await tronWebInstance.trx.getUnconfirmedAccount(address)) ?? {};
      const newAccountInfo = {
        ...accountInfo,
        [address]: account,
      };

      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: newAccountInfo,
      });
      return newAccountInfo[address];
    } catch (error) {
      log.info('getAccountInfo error: ', error);
      return {};
    }
  };

  const getChainParameters = async () => {
    try {
      let chainParameters = state.chainParameters;
      if (chainParameters && Object.keys(chainParameters).length !== 0) {
        return chainParameters;
      }

      const chainParametersObj = (await tronWebInstance.trx.getChainParameters()) ?? {};
      const newChainParameters = _.keyBy(chainParametersObj, 'key');

      dispatch({
        type: 'UPDATE_CHAIN_PARAMETERS',
        payload: newChainParameters,
      });

      return newChainParameters;
    } catch (error) {
      log.info('getChainParameters error: ', error);
      return {};
    }
  };

  const getSelectedAddressResource = async () => {
    try {
      const addressResource = state.addressResource;
      if (addressResource && Object.keys(addressResource).length !== 0) {
        return addressResource;
      }
      const res = await getAccountResourcesByAddress(tronWebInstance, selectedAddress);
      if (res.success) {
        return res.data;
      }
      return {};
    } catch (error) {
      log.info('getSelectedAddressResource error: ', error);
      return {};
    }
  };

  const calcCreateAccountCost = async () => {
    try {
      const { type } = state.selectedToken;
      const account = await getAccountInfo(receiverAddress.address);
      const chainParameters = await getChainParameters();
      let createAccountCost: number | string = 0;
      // check address is active
      if (!account.address && type !== 5 && type !== 2) {
        const { netLimit, freeNetLimit, NetUsedOnly } = await getSelectedAddressResource();
        const useBandWidth = new BigNumber(netLimit)
          .minus(freeNetLimit || 0)
          .minus(NetUsedOnly)
          .toNumber();
        const createNewAccountFeeInSystemContract =
          chainParameters?.getCreateNewAccountFeeInSystemContract?.value ?? 0;

        if (!(useBandWidth >= 200 && createNewAccountFeeInSystemContract === 0)) {
          const createNewAccountFee = new BigNumber(createNewAccountFeeInSystemContract);
          const createAccountFee = chainParameters?.getCreateAccountFee?.value ?? 0;

          createAccountCost = useBandWidth
            ? createNewAccountFee.shiftedBy(-6).toFixed()
            : createNewAccountFee.plus(createAccountFee).shiftedBy(-6).toFixed();
        }
      }
      return { chainParameters, createAccountCost, toAddress: receiverAddress.address };
    } catch (error) {
      log.info('calcCreateAccountCost error: ', error);
      return { chainParameters: {}, createAccountCost: 0, toAddress: receiverAddress.address };
    }
  };

  const calFee = async (assetId?: string) => {
    try {
      if (Object.keys(state.selectedToken).length === 0) {
        return;
      }

      const { type, precision } = state.selectedToken;
      const tokenId = getTokenId(state.selectedToken);
      const { chainParameters, createAccountCost, toAddress } = await calcCreateAccountCost();
      const costs = { ...state.costs, createAccount: createAccountCost };
      const bandwidthFee = _.get(chainParameters, 'getTransactionFee.value', 1000);
      const energyFee = _.get(chainParameters, 'getEnergyFee.value', 420);

      const {
        netLimit,
        netUsed,
        energy,
        energyUsed: selectedEnergyUsed,
      } = await getSelectedAddressResource();
      if (costs.createAccount && new BigNumber(costs.createAccount).gt(0)) {
        costs.baseBandWidth = 0;
        costs.bandwidth = 0;
      } else {
        // Calculation of trx for bandwidth consumption
        let baseBandwidth = 267; //trx
        if (type === 2 || type === 5) {
          baseBandwidth = 344; //trc20
        } else if (type !== 0) {
          baseBandwidth = 281; //trc10
        }

        //Calculating the bandwidth consumed by the input amount
        let amountCost = new BigNumber(0);
        if (type !== 5) {
          const { balanceStr } = state.selectedToken;
          // tokenAmount not exist when click max button
          const amount = state.tokenAmount || balanceStr;

          // baseBandWidth has include decimal bandWidth, need ignore amount decimal, avoid repeated calculation
          const ignoreDecimal = _.floor(new BigNumber(amount).toNumber());
          amountCost = new BigNumber(Buffer.byteLength(_.toString(ignoreDecimal), 'utf8'));
        }

        //Calculating the bandwidth consumed by the note
        let noteCost = new BigNumber(0);
        if (state.remarks) {
          noteCost = new BigNumber(Buffer.byteLength(_.toString(state.remarks), 'utf8')).plus(2);
        }

        const dynamicCost = amountCost.plus(noteCost);
        let consume = new BigNumber(0);
        if (new BigNumber(netLimit).minus(netUsed).minus(baseBandwidth).minus(dynamicCost).lt(0)) {
          consume = new BigNumber(baseBandwidth)
            .plus(dynamicCost)
            .multipliedBy(bandwidthFee)
            .shiftedBy(-6);

          costs.baseBandWidth = 0;
        } else {
          costs.baseBandWidth = new BigNumber(baseBandwidth).plus(dynamicCost).toFixed();
        }

        costs.bandwidth = consume.toNumber();
      }
      let costEnergy = 0;
      let useTrxToEnergy = 0;
      if ((type === 2 || type === 5) && toAddress) {
        let { tokenAmount: amount, remarks: note } = state;
        if (type === 5) {
          if (assetId) {
            amount = assetId;
          } else {
            log.info('calculate collection fee need assetId');
            return costs;
          }
        } else {
          amount = new BigNumber(amount).shiftedBy(precision).toFixed();
        }

        const res = await triggerConstantContract(toAddress, amount, tokenId, note, type === 5);

        const energyUsed = _.get(res, 'energy_used', 0);
        const restEnergy = new BigNumber(energy).minus(selectedEnergyUsed).toNumber();

        if (new BigNumber(restEnergy).minus(energyUsed).lt(0)) {
          costEnergy = restEnergy;
          useTrxToEnergy = new BigNumber(energyUsed)
            .plus(-restEnergy)
            .multipliedBy(energyFee)
            .shiftedBy(-6)
            .toNumber();
        } else {
          costEnergy = energyUsed;
        }
      }
      costs.costEnergy = costEnergy;
      costs.useTrxToEnergy = useTrxToEnergy;

      dispatch({
        type: 'UPDATE_COSTS',
        payload: costs,
      });

      return costs;
    } catch (error) {
      log.info('calFee error: ', error);
    }
  };

  const checkTokenAmount = async () => {
    try {
      const { tokenAmount: amount, selectedToken } = state;
      const { balanceStr, precision } = selectedToken;
      const maxAmount = balanceStr;
      const value = new BigNumber(amount);

      let status = '';
      let tips = '';

      checkAmountHasNextTurn = true;

      if (amount === '') {
        dispatch({
          type: 'CHECK_TOKEN_AMOUNT',
          payload: {
            status,
            tips,
          },
        });
        return;
      }

      if (value.isNaN()) {
        status = 'error';
        tips = 'EXCEPTION.SEND.AMOUNT_FORMAT_ERROR';
      } else if (value.lte(0)) {
        status = 'error';
        tips = 'ACCOUNT.SEND.NEED_VALID_AMOUNT';
      } else if (new BigNumber(maxAmount).lt(value)) {
        status = 'error';
        tips = 'ACCOUNT.SEND.TIPS_AMOUNT_MORE_THAN_MAX';
      } else if (value.dp() > precision) {
        status = 'error';
        tips = 'EXCEPTION.SEND.AMOUNT_DECIMALS_ERROR';
      } else {
        // avoid network affect check speed
        checkAmountHasNextTurn = false;

        ({ status, tips } = await checkTrxEnough());

        // avoid network cover the latest status
        if (checkAmountHasNextTurn) {
          return;
        }
      }

      dispatch({
        type: 'CHECK_TOKEN_AMOUNT',
        payload: {
          status,
          tips,
        },
      });
    } catch (error) {
      log.info('checkTokenAmount error: ', error);
    }
  };

  const checkTrxEnough = async () => {
    let status = '';
    let tips = '';
    try {
      const { tokenAmount: amount, selectedToken } = state;
      const value = new BigNumber(amount);
      const { type } = selectedToken;

      const costs = (await calFee()) as Costs;
      const consume = costs.bandwidth || 0;
      if (consume > 0) {
        status = 'info';
        tips = 'ACCOUNT.SEND.TIPS_BAND_WIDTH_NOT_ENOUGH';
      }

      const account = await getAccountInfo(selectedAddress);
      const isInactivated = new BigNumber(costs.createAccount).gt(0);

      let restBalance = new BigNumber(account.balance ?? 0).shiftedBy(-6).minus(consume);
      if (isInactivated && (type === 0 || type === 1)) {
        // inactivate account transfer trx, 10token need spend trx to activate
        restBalance = restBalance.minus(costs.createAccount);
      }
      if (type === 0) {
        restBalance = restBalance.minus(value);
      }

      if (restBalance.lt(0)) {
        status = 'error';
        tips = 'ACCOUNT.TRANSFER.WARNING.TRX_NOT_ENOUGH';
      }
    } catch (error) {
      log.info('checkTrxEnough error: ', error);
    } finally {
      return { status, tips };
    }
  };

  const setTokenAmount = async (inputAmount: string, from: string, tempCosts?: any) => {
    let amount = inputAmount.trim();
    try {
      const { precision, type } = state.selectedToken;
      if (amount) {
        const { valid, str } = numberParser(amount.replace(/,/g, ''), precision);
        if (!valid) {
          return;
        }

        const costs = tempCosts ?? state.costs;

        amount = str;
        if (from && type === 0) {
          amount = new BigNumber(amount)
            .minus(costs.bandwidth)
            .minus(costs.createAccount || 0)
            .minus(costs.useTrxToEnergy || 0)
            .toFixed();

          amount = parseFloat(amount) > 0 ? amount : '0';
        }
      }

      const tokenValue = calculateTokenValue(amount);
      dispatch({
        type: 'SET_TOKEN_AMOUNT',
        payload: { amount, tokenValue },
      });
    } catch (error) {
      log.info('setTokenAmount error', error);
    }
  };

  const calculateTokenValue = (amount: string): string => {
    try {
      const BN = BigNumber.clone({ DECIMAL_PLACES: 3, ROUNDING_MODE: 1 });
      const { selectedToken } = state;

      const { usdPrice = 0, cnyPrice = 0 } = selectedToken;
      const price = pricesInfo.selected === 'USD' ? usdPrice : cnyPrice;
      const symbol = pricesInfo.symbol ?? '$';

      let value = new BN(amount).multipliedBy(price);

      if (value.isNaN()) {
        return `≈ ${symbol} 0`;
      }

      const limitWorth = '0.001';
      let moneyStr = '';
      if (value.eq(0)) {
        moneyStr = +price === 0 ? '--' : `≈ ${symbol} 0`;
      } else if (value.gte(limitWorth)) {
        moneyStr = `≈ ${symbol} ${formatNumber(value, { dp: 3, rm: 1, cutZero: true })}`;
      } else {
        moneyStr = `< ${symbol} ${limitWorth}`;
      }

      return moneyStr;
    } catch (error) {
      log.info('setTokenAmount error', error);
      return '0';
    }
  };

  const quicklyInputMaxAmount = async () => {
    const { balanceStr } = state.selectedToken;
    const amount = balanceStr.toString();

    Toast.show({
      icon: 'loading',
      duration: 0,
    });
    const costs = await calFee();
    Toast.hide();

    setTokenAmount(amount, 'max', costs);
    setGaEvent('Transfer', 'Click max', 'Click max');
  };

  const setShowRemarks = useCallback((isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_REMARKS',
      payload: isShow,
    });
  }, []);

  const setRemarks = useCallback((remarks: string) => {
    dispatch({
      type: 'SET_REMARKS',
      payload: remarks.slice(0, 200),
    });
  }, []);

  const setShowModal = useCallback((isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_MODAL',
      payload: isShow,
    });
  }, []);

  const setTokenSearchKey = useCallback((searchKey: string) => {
    dispatch({
      type: 'SET_TOKEN_SEARCH_KEY',
      payload: searchKey,
    });
  }, []);

  const setTokenFilterCondition = useCallback((type: number) => {
    dispatch({
      type: 'SET_TOKEN_FILTER_CONDITION',
      payload: type,
    });
  }, []);

  return {
    state,
    pricesInfo,
    setShowTokenSelect,
    setSelectedToken,
    setTokenAmount,
    quicklyInputMaxAmount,

    setShowRemarks,
    setRemarks,
    setShowModal,
    setTokenSearchKey,
    setTokenFilterCondition,

    calFee,
    getAccountInfo,
  };
};
