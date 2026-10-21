import { Dispatch, useCallback, useEffect, useMemo, useReducer } from 'react';
import { useIntl } from 'react-intl';
import _ from 'lodash';

import Toast from '../../../components/Toast';
import { clearImportWalletInfo, getNewHDAddressParams } from '../../../service/importWalletInfo';
import { useNavigate } from 'react-router';
import PAGES from '../../../constants/pages';
import { createDefinePath } from '../../utils/account_util';
import { BigNumber } from '../../utils/numberUtils';
import { msgNode } from '../../inst';
import { callGetDerivedAddressInfoService } from '../../../service/get_derived_address_info_service';
import { callCreateDerivedAccountService } from '../../../service/create_derived_address_service';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import { useAddressInfo } from '../../../hooks/address_info';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

interface Account {
  path: string;
  address: string;
  balance?: string;
}

interface State {
  name: string;
  originAddress: string;
  originName: string;
  data: Record<string, any>;
  accountIndex: number;
  addressIndex: number;
  account: Account | null;
  isNameError: boolean;
}

const initialState = {
  name: '',
  originAddress: '',
  originName: '',
  data: {},
  accountIndex: 0,
  addressIndex: 0,
  account: null,
  isNameError: false,
};

type Action =
  | {
      type: 'INIT';
      payload: Partial<State>;
    }
  | {
      type: 'SET_ACCOUNT';
      payload: Account | null;
    }
  | {
      type: 'CHANGE_INDEX';
      payload: {
        accountIndex?: number;
        addressIndex?: number;
      };
    }
  | {
      type: 'UPDATE_BALANCE';
      payload: string;
    }
  | {
      type: 'UPDATE_WALLET_NAME';
      payload: string;
    }
  | {
      type: 'SET_NAME_ERROR';
      payload: boolean;
    };

type LocalDispatch = Dispatch<Action>;

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_ACCOUNT':
      return {
        ...state,
        account: action.payload,
      };
    case 'CHANGE_INDEX':
      return {
        ...state,
        ...action.payload,
      };
    case 'UPDATE_BALANCE': {
      const account = state.account;
      if (account) {
        account.balance = action.payload;
      }
      return {
        ...state,
        account,
      };
    }
    case 'UPDATE_WALLET_NAME':
      return {
        ...state,
        name: action.payload,
      };
    case 'SET_NAME_ERROR':
      return {
        ...state,
        isNameError: action.payload,
      };
    default:
      return state;
  }
};

export const useManualPathBiz = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const [state, dispatch] = useReducer(reducer, initialState);

  const { tronWebInstance } = useTronWebInstance();
  const { addressInfo, checkNameExist } = useAddressInfo();

  const existAccounts = addressInfo.addressItems;

  useEffect(() => {
    (async () => {
      const data = getNewHDAddressParams() || {};

      const { originAddress, originName } = data;

      dispatch({
        type: 'INIT',
        payload: {
          originAddress,
          originName,
          data,
          name: data?.name || '',
        },
      });
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.originAddress === '') {
      return;
    }
    debounceGetAccountInfo(
      tronWebInstance,
      state.originAddress,
      state.accountIndex,
      state.addressIndex,
      dispatch,
    );
  }, [tronWebInstance, state.originAddress, state.accountIndex, state.addressIndex]);

  const changeIndex = useCallback((indexInfo: { accountIndex?: number; addressIndex?: number }) => {
    if ('accountIndex' in indexInfo) {
      const tmpIndex = checkIndex(indexInfo.accountIndex!);
      if (tmpIndex === false) {
        return;
      }
      indexInfo.accountIndex = tmpIndex;
    }

    if ('addressIndex' in indexInfo) {
      const tmpIndex = checkIndex(indexInfo.addressIndex!);
      if (tmpIndex === false) {
        return;
      }
      indexInfo.addressIndex = tmpIndex;
    }

    dispatch({ type: 'CHANGE_INDEX', payload: indexInfo });
  }, []);

  const onConfirm = useCallback(async () => {
    const { name, originAddress, accountIndex, addressIndex, account } = state;
    const nameTrimmed = _.trim(name);
    if (!account) {
      return;
    }
    if (existAccounts[account.address]) {
      return;
    }

    if (state.isNameError) {
      return;
    }

    if (checkNameExist(nameTrimmed)) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'WALLET.IMPORT.NAME_REPEAT.ERROR' }),
      });
      return;
    }

    Toast.show({
      icon: 'loading',
    });

    try {
      await callCreateDerivedAccountService(msgNode, {
        fromAddress: originAddress, // derive from which address
        name: nameTrimmed,
        address: account.address,
        accountIndex: accountIndex,
        addressIndex: addressIndex,
      });

      Toast.hide();
      clearImportWalletInfo();
      navigate(PAGES.PAGE_HOMEPAGE);
    } catch (e: any) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: e.message }),
      });
    }
  }, [navigate, formatMessage, state, existAccounts]);

  const updateWalletName = useCallback((e: any) => {
    const trimmed = e.target.value.replace(/\s{2,}/g, ' ');
    dispatch({ type: 'UPDATE_WALLET_NAME', payload: trimmed });
  }, []);

  useEffect(() => {
    const trimmedName = state.name.trim();
    const length = trimmedName.length;
    if (length < 2 || length > 14) {
      dispatch({ type: 'SET_NAME_ERROR', payload: true });
    } else {
      dispatch({ type: 'SET_NAME_ERROR', payload: false });
    }
  }, [state.name]);

  const isImported = useMemo(() => {
    const account = state.account;
    if (!account) {
      return false;
    }
    return !!existAccounts[account.address];
  }, [state.account, existAccounts]);

  const isDisabled = !state.account || isImported || state.isNameError;

  return {
    state,
    changeIndex,
    onConfirm: useCheckLoginBeforeAction(onConfirm),
    updateWalletName,
    isImported,
    isDisabled,
  };
};

const getAccountInfo = async (
  tronWebInstance: any,
  data: any,
  accountIndex: number,
  addressIndex: number,
  dispatch: LocalDispatch,
) => {
  if (String(accountIndex) === '' || String(addressIndex) === '') {
    return;
  }
  const path = createDefinePath(accountIndex, addressIndex);

  const accountInfo = await callGetDerivedAddressInfoService(msgNode, {
    fromAddress: data,
    accountIndex: accountIndex,
    addressIndex: addressIndex,
  });

  const account: Account = {
    path,
    address: accountInfo.address,
  };

  dispatch({ type: 'SET_ACCOUNT', payload: account });
  await getBalance(tronWebInstance, account.address!, dispatch);
};

const debounceGetAccountInfo = _.debounce(getAccountInfo, 600);

const getBalance = async (tronWebInstance: any, address: string, dispatch: LocalDispatch) => {
  let balance = await tronWebInstance.trx.getBalance(address);
  balance = balance ? balance : 0;
  balance = new BigNumber(balance).shiftedBy(-6).toFixed();
  dispatch({ type: 'UPDATE_BALANCE', payload: balance });
};

const checkIndex = (value: number) => {
  let index = isNaN(Number(value)) ? 0 : Number(value);
  if (index && !/[0-9]/g.test(String(index))) {
    return false;
  }
  if (index > 999999) {
    index = 999999;
  }
  return index;
};
