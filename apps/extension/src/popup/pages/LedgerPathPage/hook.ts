import { Dispatch, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import _ from 'lodash';

import {
  LedgerWalletRouteParams,
  setLedgerWalletRouteParams,
} from '../../../service/importWalletInfo';
import { selectLedgerConnection } from '../../../store/slices/settings';
import { useAppSelector } from '../../../store/hooks';
import { LedgerWebHid } from '../../../lib/ledger';
import { LEDGER_LEDGER_LIVE, LEDGER_WEB_HID } from '../SettingsPage/constants';
import { BigNumber } from '../../utils/numberUtils';
import { ledgerBridgeController } from '../../../lib/ledger/bridge';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import { useAddressInfo } from '../../../hooks/address_info';
import { checkIndex, createDefinePath } from '../../utils/account_util';
import Toast from '../../../components/Toast';
import { sleep } from '../../../lib/async_func';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

interface Account {
  path: string;
  address: string;
  balance?: string;
}

interface State {
  accountIndex: number;
  addressIndex: number;
  account: Account | null;
}

const initialState: State = {
  accountIndex: 0,
  addressIndex: 0,
  account: null,
};

type Action =
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
  const { formatMessage } = useIntl();

  const [state, dispatch] = useReducer(reducer, initialState);

  const ledgerConnection = useAppSelector(selectLedgerConnection);
  const { tronWebInstance } = useTronWebInstance();
  const { addressInfo } = useAddressInfo();
  const initialized = useRef<boolean>(false);

  const existAccounts = addressInfo.addressItems;
  useEffect(() => {
    (async () => {
      if (ledgerConnection == LEDGER_LEDGER_LIVE) {
        await ledgerBridgeController.waitUntilLoaded();
      }
      await getAccountInfo(tronWebInstance, 0, 0, ledgerConnection, dispatch, formatMessage);
      initialized.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      return;
    }
    debounceGetAccountInfo(
      tronWebInstance,
      state.accountIndex,
      state.addressIndex,
      ledgerConnection,
      dispatch,
      formatMessage,
    );
  }, [tronWebInstance, ledgerConnection, state.accountIndex, state.addressIndex, formatMessage]);

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
    const { accountIndex, addressIndex, account } = state;
    if (!account) {
      return;
    }
    if (existAccounts[account.address]) {
      return;
    }
    const data: LedgerWalletRouteParams = {
      address: account.address,
      definePath: {
        path: account.path,
        accountIndex,
        addressIndex,
      },
    };
    setLedgerWalletRouteParams(data);
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
    changeIndex,
    isImported,
    isDisabled,
    onConfirm: useCheckLoginBeforeAction(onConfirm),
  };
};

const getAccountInfo = async (
  tronWebInstance: any,
  accountIndex: number,
  addressIndex: number,
  ledgerConnection: string,
  dispatch: LocalDispatch,
  formatMessage: any,
) => {
  if (String(accountIndex) === '' || String(addressIndex) === '') {
    return;
  }

  try {
    Toast.show({
      icon: 'loading',
      duration: 10000,
    });

    const path = createDefinePath(accountIndex, addressIndex);

    let address;
    if (ledgerConnection === LEDGER_WEB_HID) {
      address = await new LedgerWebHid().getAddressByDefinePath(path);
    } else {
      address = await ledgerBridgeController.getLedgerAccountByDefinePath(
        accountIndex,
        addressIndex,
      );
    }
    const account: Account = {
      address,
      path,
    };

    dispatch({ type: 'SET_ACCOUNT', payload: account });
    await getBalance(tronWebInstance, account.address, dispatch);
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

const debounceGetAccountInfo = _.debounce(getAccountInfo, 600);

const getBalance = async (tronWebInstance: any, address: string, dispatch: LocalDispatch) => {
  let balance = await tronWebInstance.trx.getBalance(address);
  balance = balance ? balance : 0;
  balance = new BigNumber(balance).shiftedBy(-6).toFixed();
  dispatch({ type: 'UPDATE_BALANCE', payload: balance });
};
