import { Dispatch, useCallback, useEffect, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router';
import _ from 'lodash';
import * as bip32 from 'bip32';
// @ts-ignore
import bip39 from 'bip39';
// @ts-ignore
import TronWeb from 'tronweb';

import {
  getImportWalletRouteParams,
  setImportWalletRouteParams,
} from '../../../service/importWalletInfo';
import Toast from '../../../components/Toast';
import PAGES from '../../../constants/pages';
import { BigNumber } from '../../utils/numberUtils';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import { useAddressInfo } from '../../../hooks/address_info';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

const PAGE_SIZE = 10;

interface AccountType {
  index: number;
  address: string;
  balance?: string;
}

interface State {
  showModal: boolean;
  page: number;
  data: Record<string, any>;
  accountList: AccountType[];
  selectAddresses: string[];
}

const initialState: State = {
  showModal: false,
  page: 0,
  data: {},
  accountList: [],
  selectAddresses: [],
};

type Action =
  | {
      type: 'TOGGLE_MODAL';
    }
  | {
      type: 'SET_DATA';
      payload: Partial<State>;
    }
  | {
      type: 'SET_PAGE';
      payload: number;
    }
  | {
      type: 'ADD_ACCOUNTS';
      payload: State['accountList'];
    }
  | {
      type: 'UPDATE_BALANCE';
      payload: {
        address: string;
        balance: string;
      };
    }
  | {
      type: 'SET_SELECT_ADDRESSES';
      payload: State['selectAddresses'];
    };

type LocalDispatch = Dispatch<Action>;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'TOGGLE_MODAL':
      return {
        ...state,
        showModal: !state.showModal,
      };
    case 'SET_PAGE':
      return {
        ...state,
        page: action.payload,
      };
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
      };
    case 'ADD_ACCOUNTS':
      return {
        ...state,
        accountList: [...state.accountList, ...action.payload],
      };
    case 'UPDATE_BALANCE': {
      const { address, balance } = action.payload;
      const accountList = state.accountList;

      const found = accountList.find((ele) => ele.address == address);
      if (found) {
        found.balance = balance;
      }
      return {
        ...state,
        accountList,
      };
    }
    case 'SET_SELECT_ADDRESSES':
      return {
        ...state,
        selectAddresses: action.payload,
      };
    default:
      return state;
  }
};

export const useImportAddressBiz = () => {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);
  const isLoading = useRef(false);

  const { tronWebInstance } = useTronWebInstance();
  const { addressInfo } = useAddressInfo();

  const existAccounts = addressInfo.addressItems;

  // initialize
  useEffect(() => {
    const data = getImportWalletRouteParams() || {};
    const { originText } = data;
    dispatch({ type: 'SET_DATA', payload: data as Partial<State> });
    // Use setTimeout because: bip39 takes 500ms to generate the address, and the page will be blank for 500ms
    setTimeout(() => {
      getAccount(isLoading, 0, originText || '', tronWebInstance, dispatch);
    }, 0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isScrolling = useRef<boolean>(false);
  const onEndReached = useCallback(
    (e: any) => {
      if (state.page === 10) {
        return;
      }

      if (isScrolling.current) {
        return;
      }
      const scrollTop = e.target.scrollTop;
      const clientHeight = e.target.clientHeight;
      const scrollHeight = e.target.scrollHeight;

      if (scrollTop + clientHeight >= scrollHeight - 20) {
        isScrolling.current = true;
        getAccount(isLoading, state.page, state.data.originText, tronWebInstance, dispatch);
        isScrolling.current = false;
      }
    },
    [state.page, state.data, tronWebInstance],
  );

  const onToggleItem = useCallback(
    (address: string) => {
      const isImported = !!existAccounts[address];
      if (isImported) {
        return;
      }

      let selectAddresses = [...state.selectAddresses];
      if (selectAddresses.includes(address)) {
        selectAddresses = selectAddresses.filter((_address) => _address !== address);
      } else if (_.size(selectAddresses) < 10) {
        selectAddresses.push(address);
      }
      dispatch({ type: 'SET_SELECT_ADDRESSES', payload: selectAddresses });
    },
    [state.selectAddresses, existAccounts],
  );

  const toggleModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODAL' });
  }, []);

  const onConfirm = useCallback(() => {
    const { data, accountList, selectAddresses } = state;
    if (_.size(selectAddresses) === 0) {
      return;
    }

    const selectIndexSet = new Set();
    accountList.forEach((account) => {
      if (selectAddresses.includes(account.address)) {
        selectIndexSet.add(account.index);
      }
    });
    data.pathMode = [...selectIndexSet];
    data.definePath = false;
    setImportWalletRouteParams(data);
    navigate(-1);
  }, [navigate, state]);

  const onConfirmModal = useCallback(() => {
    navigate(PAGES.PAGE_IMPORT_PATH);
  }, [navigate]);

  const isAccountExist = useCallback(
    (address: string) => {
      return !!existAccounts[address];
    },
    [existAccounts],
  );

  const isAddressSelected = useCallback(
    (address: string) => {
      return state.selectAddresses.includes(address);
    },
    [state.selectAddresses],
  );

  return {
    state,
    onEndReached,
    onToggleItem,
    toggleModal,
    onConfirm: useCheckLoginBeforeAction(onConfirm),
    onConfirmModal,
    isAccountExist,
    isAddressSelected,
    hasSelected: _.size(state.selectAddresses) > 0,
  };
};

const getAccount = (
  isLoading: { current: boolean },
  page: number,
  mnemonic: string,
  tronWebInstance: any,
  dispatch: LocalDispatch,
) => {
  if (isLoading.current) {
    return;
  }
  isLoading.current = true;
  Toast.show({
    icon: 'loading',
    duration: 5000,
  });
  const newAccounts = [];
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const addresses = [];

  for (let index = start; index < end; index++) {
    const { address } = getAccountBySeq(mnemonic, index);
    const account: AccountType = {
      index,
      address,
    };
    addresses.push(account.address);
    newAccounts.push(account);
  }
  dispatch({ type: 'SET_PAGE', payload: page + 1 });
  dispatch({ type: 'ADD_ACCOUNTS', payload: newAccounts });
  isLoading.current = false;
  Toast.hide();

  loadAccountBalance(tronWebInstance, addresses, dispatch).then();
};

const loadAccountBalance = async (
  tronWebInstance: any,
  addresses: string[],
  dispatch: LocalDispatch,
) => {
  for (const address of addresses) {
    let balance = await tronWebInstance.trx.getBalance(address);
    balance = balance ? balance : 0;
    balance = new BigNumber(balance).shiftedBy(-6).toFixed();
    dispatch({
      type: 'UPDATE_BALANCE',
      payload: {
        address,
        balance,
      },
    });
  }
};

export function getAccountBySeq(mnemonic: string, index = 0) {
  const seed = bip39.mnemonicToSeed(mnemonic);
  const node = bip32.fromSeed(seed);
  const child = node.derivePath(`m/44'/195'/0'/0/${index}`);
  const privateKey = child?.privateKey?.toString('hex');
  const address = TronWeb.address.fromPrivateKey(privateKey);

  return {
    address,
  };
}
