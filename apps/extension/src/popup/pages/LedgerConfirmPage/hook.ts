import { ChangeEvent, Dispatch, useCallback, useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import log from 'loglevel';

import { BigNumber } from '../../utils/numberUtils';
import { supportStorageKey } from '../../../constants/wallet_type';
import {
  clearImportWalletInfo,
  getLedgerWalletRouteParams,
  LedgerWalletRouteParams,
  setLedgerWalletRouteParams,
} from '../../../service/importWalletInfo';
import { msgNode } from '../../inst';
import PAGES from '../../../constants/pages';
import { useAppSelector } from '../../../store/hooks';
import { callGetUniqueNameService } from '../../../service/get_unique_name_service';
import { useInputPassword } from '../../../components/InputPassword';
import { useAddressInfo } from '../../../hooks/address_info';
import { LedgerWebHid } from '../../../lib/ledger';
import { selectLedgerConnection } from '../../../store/slices/settings';
import {
  callCreateLedgerAccountsService,
  LedgerAccountParam,
} from '../../../service/create_ledger_accounts_service';
import { useSaveLatestLocation, useShouldNavigateLoginPage } from '../../../hooks/location';
import { callUpdateCheckAuthedService } from '../../../service/update_check_authed_service';
import { getAccountInfo, setAccountInfo } from '../../../hooks/account_info';
import { LEDGER_WEB_HID } from '../SettingsPage/constants';
import Toast from '../../../components/Toast';
import { ledgerBridgeController } from '../../../lib/ledger/bridge';
import { useGlobalIsAuthed } from '../../../hooks/auth';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import { AddressItemsRecord } from '../../../store/slices/address_info';
import { sleep } from '../../../lib/async_func';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

interface ExtractParam {
  index: number;
  path?: string;
  balance?: string;
}

interface AccountType extends LedgerAccountParam, ExtractParam {}

interface State {
  accounts: AccountType[];
  selectAddresses: string[];
}

const initialState: State = {
  accounts: [],
  selectAddresses: [],
};

type Action =
  | {
      type: 'SET_ACCOUNTS';
      payload: State['accounts'];
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

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'SET_ACCOUNTS':
      return {
        ...state,
        accounts: action.payload,
      };
    case 'UPDATE_BALANCE': {
      const accounts = state.accounts;
      const { address, balance } = action.payload;

      const found = accounts.find((ele) => ele.address == address);
      if (found) {
        found.balance = balance;
      }

      return {
        ...state,
        accounts,
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

type LocalDispatch = Dispatch<Action>;

export const useImportConfirmBiz = () => {
  useSaveLatestLocation();
  const shouldNavigateLoginPage = useShouldNavigateLoginPage();
  const navigate = useNavigate();

  const { formatMessage } = useIntl();

  const ledgerConnection = useAppSelector(selectLedgerConnection);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [name, setName] = useState('');
  const [isNameError, setNameError] = useState<boolean>(false);
  const [defaultName, setDefaultName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState(2);
  const { tronWebInstance } = useTronWebInstance();
  const { addressInfo, checkNameExist } = useAddressInfo();

  const existAccounts: AddressItemsRecord = addressInfo.addressItems;

  const {
    password,
    confirmPassword,
    isValidPassword,
    isSamePassword,
    isNeedPassword,
    onChangePasswordState,
  } = useInputPassword();

  const WAIT_TIME = 30000;
  const isAuthed = useGlobalIsAuthed();

  useEffect(() => {
    (async () => {
      if (isAuthed) {
        const fromPage = await getAccountInfo(supportStorageKey.fromPage);
        if (fromPage === PAGES.PAGE_GUIDE) {
          navigate(PAGES.PAGE_HOMEPAGE, { replace: true });
        }
      }
    })();
  }, [navigate, isAuthed]);

  // initialize
  useEffect(() => {
    (async () => {
      const { name } = await callGetUniqueNameService(msgNode, {
        name: 'Ledger',
        idKey: 'ledgerName',
      });

      setName(name);
      setDefaultName(name);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const trimmedName = name.trim();
    const length = trimmedName.length;
    if (length < 2 || length > 14) {
      setNameError(true);
    } else {
      setNameError(false);
    }
  }, [name]);

  // initialize
  useEffect(() => {
    (async () => {
      await getLedgerAccount();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLedgerAccount = async () => {
    let data = getLedgerWalletRouteParams();
    if (_.size(data) === 0) {
      let index = 0;
      let address = '';
      try {
        // if it has not authed, should navigate LoginPage, will not toast loading

        if (ledgerConnection === LEDGER_WEB_HID) {
          !shouldNavigateLoginPage &&
            Toast.show({
              icon: 'loading',
              duration: 30000,
            });
          ({ index, address } = await new LedgerWebHid().getAvailableAddress(
            addressInfo.addressItems,
          ));
        } else {
          !shouldNavigateLoginPage &&
            Toast.show({
              icon: 'loading',
              duration: 30000,
            });

          try {
            const str = await getAccountInfo(supportStorageKey.ledgerSetting);
            const ledgerSetting = JSON.parse(str);
            if (ledgerSetting.initialize && new Date().getTime() - ledgerSetting.at < WAIT_TIME) {
              log.debug('ledgerSetting: ====> ', ledgerSetting.at);
              log.debug(new Date().getTime() - Number(ledgerSetting));
              Toast.hide();
              setIsModalVisible(true);
              setModalType(2);
              return;
            }
          } catch (e) {
            log.info(e);
          }
          const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
            Toast.hide();
            setIsModalVisible(true);
            setModalType(1);
          }, WAIT_TIME);

          await setAccountInfo(
            supportStorageKey.ledgerSetting,
            JSON.stringify({
              initialize: true,
              at: new Date().getTime(),
            }),
          );
          await ledgerBridgeController.waitUntilLoaded();
          ({ index, address } = await ledgerBridgeController.getAvailableAddress(
            addressInfo.addressItems,
          ));
          clearTimeout(timer);
          await setAccountInfo(supportStorageKey.ledgerSetting, '');
          Toast.hide();
        }

        data = {
          index,
          address,
        };
        setLedgerWalletRouteParams(data);
      } catch (err: any) {
        Toast.show({
          icon: 'fail',
          content: formatMessage({ id: 'CREATION.LEDGER.CHOOSE_ADDRESS.CHECK' }),
          duration: 2000,
        });
        await sleep(2000);
      } finally {
        setTimeout(Toast.hide, 35000);
      }
    }
    Toast.hide();
    await loadAccounts(tronWebInstance, data, dispatch);
  };

  const goChooseAddress = useCallback(() => {
    navigate(PAGES.PAGE_LEDGER_ADDRESS);
  }, [navigate]);

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

  const onChangeName = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const trimmed = e.target.value.replace(/\s{2,}/g, ' ');
    setName(trimmed);
  }, []);

  const onSubmit = useCallback(async () => {
    const { selectAddresses } = state;
    if (_.size(selectAddresses) === 0) {
      return;
    }

    const trimmedName = _.trim(name);
    if (
      isNameError ||
      (isNeedPassword && (!isSamePassword || !isValidPassword || _.size(password) === 0))
    ) {
      return;
    }

    if (checkNameExist(trimmedName)) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'WALLET.IMPORT.NAME_REPEAT.ERROR' }),
      });
      return;
    }

    try {
      await callCreateLedgerAccountsService(msgNode, {
        name: trimmedName,
        password,
        accounts: state.accounts,
      });

      clearImportWalletInfo();
      Toast.show({
        icon: 'success',
        content: formatMessage({
          id: 'CREATION.RESTORE.KEY_STORE.ADD_SUCCESS',
        }),
        afterClose: async () => {
          if (!isAuthed) {
            await callUpdateCheckAuthedService(msgNode);
          } else {
            navigate(PAGES.PAGE_HOMEPAGE);
          }
        },
      });
    } catch (e: any) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({
          id: e.message,
        }),
      });
    }
  }, [
    navigate,
    isAuthed,
    state,
    formatMessage,
    password,
    name,
    isNameError,
    isNeedPassword,
    checkNameExist,
    isValidPassword,
    isSamePassword,
  ]);

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

  const backPrePage = useCallback(async () => {
    await setAccountInfo(supportStorageKey.ledgerSetting, '');
    navigate(PAGES.PAGE_ADD_WALLET);
  }, [navigate]);

  const retryGetLedgerAccount = useCallback(async () => {
    await setAccountInfo(supportStorageKey.ledgerSetting, '');
    setIsModalVisible(false);
    setModalType(2);
    await getLedgerAccount();
  }, [getLedgerAccount]);

  return {
    name,
    isNameError,
    defaultName,
    onChangeName,
    password,
    confirmPassword,
    isValidPassword,
    isSamePassword,
    isNeedPassword,
    onChangePasswordState,
    state,
    goChooseAddress: useCheckLoginBeforeAction(goChooseAddress),
    onToggleItem,
    onSubmit: useCheckLoginBeforeAction(onSubmit),
    isAccountExist,
    isAddressSelected,
    hasSelected: _.size(state.selectAddresses) > 0,
    hasWrongInput:
      isNameError ||
      (isNeedPassword && (!isSamePassword || !isValidPassword || _.size(password) === 0)),
    isModalVisible,
    backPrePage,
    retryGetLedgerAccount,
    modalType,
  };
};

const loadAccounts = async (
  tronWebInstance: any,
  data: LedgerWalletRouteParams,
  dispatch: LocalDispatch,
) => {
  if (_.size(data) == 0) {
    return;
  }
  const newAccounts = [];
  const addresses = [];
  const { index, address, pathMode } = data;
  if (pathMode && _.size(pathMode) > 0) {
    const selectAddress = data.selectAddress!;

    pathMode.forEach((accountIndex: number, idx: number) => {
      const account: AccountType = {
        index: accountIndex,
        address: selectAddress[idx],
        accountIndex,
        addressIndex: 0,
      };
      newAccounts.push(account);
      addresses.push(account.address);
    });
  } else if (data.definePath) {
    const definePath = data.definePath;
    const account: AccountType = {
      index: definePath.accountIndex!,
      address: address!,
      accountIndex: definePath.accountIndex!,
      addressIndex: definePath.addressIndex!,
      path: definePath.path,
    };
    newAccounts.push(account);
    addresses.push(account.address);
  } else {
    const account: AccountType = {
      index: index!,
      address: address!,
      accountIndex: index!,
      addressIndex: 0,
    };
    newAccounts.push(account);
    addresses.push(account.address);
  }
  dispatch({ type: 'SET_ACCOUNTS', payload: newAccounts });
  dispatch({ type: 'SET_SELECT_ADDRESSES', payload: addresses });
  await loadAccountBalance(tronWebInstance, addresses, dispatch);
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
    dispatch({ type: 'UPDATE_BALANCE', payload: { address, balance } });
  }
};
