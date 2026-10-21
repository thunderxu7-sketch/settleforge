import { Dispatch, useCallback, useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router';
import _ from 'lodash';

import {
  getImportWalletRouteParams,
  setImportWalletRouteParams,
} from '../../../service/importWalletInfo';
import PAGES from '../../../constants/pages';
import { BigNumber } from '../../utils/numberUtils';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import { useAddressInfo } from '../../../hooks/address_info';
import { checkIndex, createDefinePath, getAccountByDefinePath } from '../../utils/account_util';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

interface Account {
  path: string;
  address: string;
  balance?: string;
}

interface State {
  data: Record<string, any>;
  accountIndex: number;
  addressIndex: number;
  account: Account | null;
}

const initialState: State = {
  data: {},
  accountIndex: 0,
  addressIndex: 0,
  account: null,
};

type Action =
  | {
      type: 'SET_DATA';
      payload: Partial<State>;
    }
  | {
      type: 'SET_ACCOUNT';
      payload: Account;
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
    };

type LocalDispatch = Dispatch<Action>;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
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
    default:
      return state;
  }
};

export const useImportPathBiz = () => {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);

  const { tronWebInstance } = useTronWebInstance();
  const { addressInfo } = useAddressInfo();

  const existAccounts = addressInfo.addressItems;

  useEffect(() => {
    (async () => {
      const data = getImportWalletRouteParams() || {};
      dispatch({ type: 'SET_DATA', payload: data as Partial<State> });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    debounceGetAccountInfo(
      tronWebInstance,
      state.data,
      state.accountIndex,
      state.addressIndex,
      dispatch,
    );
  }, [tronWebInstance, state.data, state.accountIndex, state.addressIndex]);

  const goBack = useCallback(() => {
    navigate(PAGES.PAGE_IMPORT_ADDRESS);
  }, [navigate]);

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

  const onConfirm = useCallback(() => {
    const { accountIndex, addressIndex, data, account } = state;
    if (!account) {
      return;
    }
    if (existAccounts[account.address]) {
      return;
    }
    const newData = _.cloneDeep(data);
    newData.definePath = {
      accountIndex,
      addressIndex,
    };
    setImportWalletRouteParams(newData);
    navigate(-2);
  }, [navigate, state, existAccounts]);

  const isImported = useMemo(() => {
    const account = state.account;
    if (!account) {
      return false;
    }
    return !!existAccounts[account.address];
  }, [state.account, existAccounts]);

  const isDisabled = !state.account || isImported;

  return {
    state,
    goBack,
    changeIndex,
    isImported,
    isDisabled,
    onConfirm: useCheckLoginBeforeAction(onConfirm),
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
  const { originText } = data;
  const path = createDefinePath(accountIndex, addressIndex);
  const { address } = getAccountByDefinePath(originText, path);
  const account: Account = {
    address,
    path,
  };

  dispatch({ type: 'SET_ACCOUNT', payload: account });
  await getBalance(tronWebInstance, account.address, dispatch);
};

const debounceGetAccountInfo = _.debounce(getAccountInfo, 600);

const getBalance = async (tronWebInstance: any, address: string, dispatch: LocalDispatch) => {
  let balance = await tronWebInstance.trx.getBalance(address);
  balance = balance ? balance : 0;
  balance = new BigNumber(balance).shiftedBy(-6).toFixed();
  dispatch({ type: 'UPDATE_BALANCE', payload: balance });
};
