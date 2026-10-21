import { useReducer, useEffect, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';
// @ts-ignore
import TronWeb from 'tronweb';
import _ from 'lodash';
import log from 'loglevel';

import { getSelectedNode } from '../../../../store/slices/node_management';
import { selectAddressInfo } from '../../../../store/slices/address_info';
import { queryCustomToken, addCustomToken } from '../../../../service/local_data_service';
import { resourceManager } from '../../../../domain/resource_manager';
import { useTronWebInstance } from './../../../../hooks/tronweb_popup';
import useCheckLoginBeforeAction from '../../../../hooks/check_logion_before_action';
import { useSaveLatestLocation } from '../../../../hooks/location';
import { useAppSelector } from '../../../../store/hooks';
import { CustomTokenInfoType } from '../../../../constants/types';
import PAGES from '../../../../constants/pages';
import { getAllLocalTokens } from '../../Transfer/utils/token';
import { BigNumber } from '../../../utils/numberUtils';

import Toast from '../../../../components/Toast';

export interface AddressValueStatusType {
  value?: string;
  error?: string;
  step?: number;
}

interface State {
  customTokenInfo: CustomTokenInfoType;
  addressValueStatus: AddressValueStatusType;
  inputAbbr: string;
  inputName: string;
}

type Action =
  | { type: 'CUSTOM_TOKEN'; payload: CustomTokenInfoType }
  | { type: 'ADDRESS_VALUE'; payload: AddressValueStatusType }
  | { type: 'SET_INPUT_ABBR'; payload: string }
  | { type: 'SET_INPUT_NAME'; payload: string }
  | {
      type: 'INIT_CUSTOM_TOKEN_INFO';
      payload: {
        customTokenInfo: CustomTokenInfoType;
        inputAbbr: string;
        inputName: string;
      };
    };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'CUSTOM_TOKEN':
      return {
        ...state,
        customTokenInfo: action.payload,
      };
    case 'ADDRESS_VALUE':
      return {
        ...state,
        addressValueStatus: action.payload,
      };
    case 'SET_INPUT_ABBR':
      return {
        ...state,
        inputAbbr: action.payload,
      };
    case 'SET_INPUT_NAME':
      return {
        ...state,
        inputName: action.payload,
      };

    case 'INIT_CUSTOM_TOKEN_INFO':
      return {
        ...state,
        customTokenInfo: action.payload.customTokenInfo,
        inputAbbr: action.payload.inputAbbr,
        inputName: action.payload.inputName,
      };
    default:
      return state;
  }
};

const initCustomToken = {
  totalSupply: 0,
  type: 2,
  name: '',
  abbr: '',
  decimal: 0,
  contractAddress: '',
  logoUrl: '',
  price: 0,
  trxCount: new BigNumber(0),
  noFunctions: [],
  usdPrice: '0',
  usdCount: 0,
  cnyPrice: '0',
  cnyCount: 0,
};

const initAddressValueStatus = {
  value: '',
  error: '',
  step: 0,
};

const initialState: State = {
  customTokenInfo: initCustomToken,
  addressValueStatus: initAddressValueStatus,
  inputAbbr: '',
  inputName: '',
};

export const useAssetsManagementBiz = () => {
  const intl = useIntl();
  useSaveLatestLocation();
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo.selectedAddress;
  const selectedNode = useAppSelector(getSelectedNode);
  const navigate = useNavigate();

  const { tronWebInstance } = useTronWebInstance();

  useEffect(() => {
    (async () => {
      await resourceManager.setAllAssetList(selectedAddress, selectedNode);
    })();
  }, []);

  const [state, dispatch] = useReducer(reducer, initialState);

  const validateAddress = async (
    tokenAddress: string,
  ): Promise<{ errorMsg: string; tmpStep: number }> => {
    let errorMsg = '';
    let tmpStep = 0;
    if (!TronWeb.isAddress(tokenAddress)) {
      return {
        errorMsg: intl.formatMessage({ id: 'ASSET.CUSTOM.CONTRACT_ADDRESS.INVALID' }),
        tmpStep,
      };
    }
    const tokenInfo = await tronWebInstance.trx.getAccount(tokenAddress);
    if (tokenInfo?.type !== 'Contract') {
      return {
        errorMsg: intl.formatMessage({ id: 'ASSET.CUSTOM.CONTRACT_ADDRESS.FORBIDDEN' }),
        tmpStep,
      };
    }

    const allTokenList = await getAllLocalTokens(selectedAddress, selectedNode);
    const tokens = _.concat([], allTokenList);
    const contractInfo = _.find(tokens, (item) => {
      return String(tokenAddress) === String(item?.contractAddress);
    });
    if (_.size(contractInfo) > 0) {
      return { errorMsg: intl.formatMessage({ id: 'ASSET.CUSTOM.ADDED' }), tmpStep };
    }

    const res = await queryCustomToken(selectedAddress, tokenInfo.address);

    const customTokenInfo = _.get(res, 'data', {});
    const abbr = _.get(customTokenInfo, 'assetInfo.shortName', '');
    const name = _.get(customTokenInfo, 'assetInfo.name', '');
    const type = _.get(customTokenInfo, 'assetInfo.type', 2);
    const decimal = _.get(customTokenInfo, 'assetInfo.precision', 0);
    const contractAddress = _.get(customTokenInfo, 'assetInfo.contractAddress', '');
    const totalSupply = _.get(customTokenInfo, 'assetInfo.totalSupply', 0);
    const logoUrl = _.get(customTokenInfo, 'assetInfo.logoUrl', '');
    const price = _.get(customTokenInfo, 'assetInfo.price', 0);
    const trxCount = _.get(customTokenInfo, 'assetInfo.trxCount', new BigNumber(0));
    const noFunctions = _.get(customTokenInfo, 'noFunctions', '').split(',');

    dispatch({
      type: 'INIT_CUSTOM_TOKEN_INFO',
      payload: {
        customTokenInfo: {
          abbr,
          name,
          type,
          decimal,
          contractAddress,
          totalSupply,
          logoUrl,
          price,
          trxCount,
          noFunctions,
          usdPrice: '0',
          usdCount: 0,
          cnyPrice: '0',
          cnyCount: 0,
        },
        inputAbbr: abbr,
        inputName: name,
      },
    });

    const status = _.get(customTokenInfo, 'status');
    const balanceFunction = _.get(customTokenInfo, 'balanceFunction', false);
    const transferEvent = _.get(customTokenInfo, 'transferEvent', false);
    if (status === 4) {
      errorMsg = intl.formatMessage({ id: 'ASSET.CUSTOM.ADDED' });
    } else if (status === 3) {
      errorMsg = intl.formatMessage({ id: 'ASSET.CUSTOM.RECORD' });
    } else if (status === 2) {
      errorMsg = intl.formatMessage({ id: 'ASSET.SEARCH.NOT_FIND' });
    } else if (status === 1) {
      errorMsg = intl.formatMessage({ id: 'ASSET.CUSTOM.CONTRACT_ADDRESS.INVALID' });
    } else if (!balanceFunction) {
      errorMsg = intl.formatMessage({ id: 'ASSET.CUSTOM.CONTRACT_ADDRESS.NOT_TOKEN_ADDRESS' });
    } else if (!transferEvent) {
      errorMsg = intl.formatMessage({ id: 'ASSET.CUSTOM.CONTRACT_ADDRESS.NOT_TRC_ADDRESS' });
    } else {
      tmpStep = 1;
    }
    return { errorMsg, tmpStep };
  };

  const afterAddrChange = async (tokenAddress: string) => {
    try {
      const { addressValueStatus } = state;
      if (_.get(addressValueStatus, 'value') === tokenAddress) {
        return;
      }
      if (_.size(tokenAddress) === 0) {
        dispatch({
          type: 'ADDRESS_VALUE',
          payload: {
            value: '',
            error: '',
            step: 0,
          },
        });
        return;
      }

      Toast.show({ icon: 'loading', duration: 0 });

      dispatch({
        type: 'ADDRESS_VALUE',
        payload: {
          value: tokenAddress,
          error: '',
          step: 0,
        },
      });
      const { errorMsg, tmpStep } = await validateAddress(tokenAddress);
      const errorMsgStr = errorMsg;
      dispatch({
        type: 'ADDRESS_VALUE',
        payload: {
          value: tokenAddress,
          error: errorMsg,
          step: tmpStep,
        },
      });
      Toast.hide();
      return _.size(errorMsgStr) === 0;
    } catch (error) {
      Toast.hide();
      Toast.show({
        icon: 'fail',
        content: intl.formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
        duration: 3000,
      });

      log.info('afterAddrChange error: ', error);
    }
  };

  const toStep = (stepNumber: number, contractAddress = '') => {
    dispatch({
      type: 'ADDRESS_VALUE',
      payload: {
        value: contractAddress,
        step: stepNumber,
      },
    });
  };

  const addToken = async () => {
    try {
      const { type, decimal, contractAddress } = state.customTokenInfo;
      const { inputAbbr, inputName } = state;

      Toast.show({
        icon: 'loading',
      });

      const res = await addCustomToken(
        selectedAddress,
        inputName,
        inputAbbr,
        contractAddress,
        type,
        decimal,
      );
      if (res.success && _.get(res, 'data')) {
        Toast.show({
          icon: 'success',
          content: intl.formatMessage(
            { id: 'ASSET.CUSTOM.TIP.ADD_SUCCESS' },
            { symbol: inputAbbr },
          ),
        });
        navigate(PAGES.PAGE_HOMEPAGE);
      } else {
        Toast.show({
          icon: 'fail',
          content: intl.formatMessage({ id: 'TRANSACTIONS.FAILED' }),
        });
      }
    } catch (err) {
      log.info(err);
      Toast.show({
        icon: 'fail',
        content: intl.formatMessage({ id: 'TRANSACTIONS.FAILED' }),
      });
    }
  };

  const setInputAbbr = (value: string) => {
    dispatch({
      type: 'SET_INPUT_ABBR',
      payload: value,
    });
  };

  const setInputName = (value: string) => {
    dispatch({
      type: 'SET_INPUT_NAME',
      payload: value,
    });
  };

  const onNextBtnClick = useCallback(() => {
    const { step, value } = state.addressValueStatus;
    if (step == 1) {
      toStep(2, value);
    }
  }, [state.addressValueStatus]);

  return {
    state,
    afterAddrChange,
    toStep,
    addToken,
    onNextBtnClick: useCheckLoginBeforeAction(onNextBtnClick),
    setInputAbbr,
    setInputName,
  };
};
