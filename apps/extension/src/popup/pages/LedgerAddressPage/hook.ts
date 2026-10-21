import { Dispatch, useCallback, useEffect, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import _ from 'lodash';

import {
  LedgerWalletRouteParams,
  setLedgerWalletRouteParams,
} from '../../../service/importWalletInfo';
import Toast from '../../../components/Toast';
import PAGES from '../../../constants/pages';
import { useAppSelector } from '../../../store/hooks';
import { selectLedgerConnection } from '../../../store/slices/settings';
import { LedgerWebHid } from '../../../lib/ledger';
import { LEDGER_LEDGER_LIVE, LEDGER_WEB_HID } from '../SettingsPage/constants';
import { BigNumber } from '../../utils/numberUtils';
import { ledgerBridgeController } from '../../../lib/ledger/bridge';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import { useAddressInfo } from '../../../hooks/address_info';
import { createDefinePath } from '../../utils/account_util';
import { sleep } from '../../../lib/async_func';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

const PAGE_SIZE = 5;

interface AccountType {
  index: number;
  address: string;
  path?: string;
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
      type: 'SET_PAGE';
      payload: number;
    }
  | {
      type: 'ADD_ACCOUNT';
      payload: AccountType;
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
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accountList: [...state.accountList, action.payload],
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
  const { formatMessage } = useIntl();

  const ledgerConnection = useAppSelector(selectLedgerConnection);
  const [state, dispatch] = useReducer(reducer, initialState);
  const isLoading = useRef(false);

  const { tronWebInstance } = useTronWebInstance();
  const { addressInfo } = useAddressInfo();

  const existAccounts = addressInfo.addressItems;

  // initialize
  useEffect(() => {
    (async () => {
      Toast.show({
        icon: 'loading',
        duration: 0,
      });
      if (ledgerConnection === LEDGER_LEDGER_LIVE) {
        await ledgerBridgeController.waitUntilLoaded();
      }
      getAccount(isLoading, 0, tronWebInstance, ledgerConnection, dispatch, formatMessage).then();
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isScrolling = useRef<boolean>(false);

  const onEndReached = useCallback(
    async (e: any) => {
      if (state.page === 20) {
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
        await getAccount(
          isLoading,
          state.page,
          tronWebInstance,
          ledgerConnection,
          dispatch,
          formatMessage,
        );
        isScrolling.current = false;
      }
    },
    [state.page, ledgerConnection, tronWebInstance, formatMessage],
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
    const { accountList, selectAddresses } = state;

    if (_.size(selectAddresses) === 0) {
      return;
    }
    const selectIndexSet = new Set<number>();
    const selectAddress = new Set<string>();

    accountList.forEach((account) => {
      if (selectAddresses.includes(account.address)) {
        selectIndexSet.add(account.index);
        selectAddress.add(account.address);
      }
    });

    const data: LedgerWalletRouteParams = {
      pathMode: [...selectIndexSet],
      selectAddress: [...selectAddress],
    };
    setLedgerWalletRouteParams(data);
    navigate(-1);
  }, [navigate, state]);

  const onConfirmModal = useCallback(() => {
    navigate(PAGES.PAGE_LEDGER_PATH);
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

const getAccount = async (
  isLoading: { current: boolean },
  page: number,
  tronWebInstance: any,
  ledgerConnection: string,
  dispatch: LocalDispatch,
  formatMessage: any,
) => {
  try {
    if (isLoading.current) {
      return;
    }
    isLoading.current = true;
    Toast.show({
      icon: 'loading',
      duration: 30000,
    });

    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const addresses = [];

    for (let index = start; index < end; index++) {
      const path = createDefinePath(index, 0);
      let address;
      if (ledgerConnection === LEDGER_WEB_HID) {
        address = await new LedgerWebHid().getAddressByDefinePath(path);
      } else {
        address = await ledgerBridgeController.getLedgerAccountByDefinePath(index, 0);
      }
      const account: AccountType = {
        index,
        address,
      };
      addresses.push(address);
      dispatch({ type: 'ADD_ACCOUNT', payload: account });
    }
    dispatch({ type: 'SET_PAGE', payload: page + 1 });
    isLoading.current = false;
    Toast.hide();
    loadAccountBalance(tronWebInstance, addresses, dispatch).then();
  } catch (e: any) {
    Toast.show({
      icon: 'fail',
      content: formatMessage({ id: 'CREATION.LEDGER.CHOOSE_ADDRESS.CHECK' }),
      duration: 2000,
    });
    await sleep(2000);
  } finally {
    Toast.hide();
  }
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
