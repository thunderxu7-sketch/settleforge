import { Dispatch, useCallback, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import _ from 'lodash';
// @ts-ignore
import TronWeb from 'tronweb';

import { supportStorageKey, WALLET_IMPORT_TYPE } from '../../../constants/wallet_type';
import {
  createDefinePath,
  getAccountAtIndex,
  getAccountByDefinePath,
  getAccountBySeq,
} from '../../utils/account_util';
import { BigNumber } from '../../utils/numberUtils';
import {
  clearImportWalletInfo,
  DefinePath,
  getImportWalletRouteParams,
} from '../../../service/importWalletInfo';
import {
  callCreatePrivateAccountsService,
  PrivateKeyAccountParam,
} from '../../../service/create_private_key_accounts_service';
import {
  callCreateMnemonicAccountsService,
  MnemonicAccountParam,
} from '../../../service/create_mnemonic_accounts_service';
import { msgNode } from '../../inst';
import PAGES from '../../../constants/pages';
import { useGlobalIsAuthed } from '../../../hooks/auth';
import { getAccountInfo } from '../../../hooks/account_info';
import { callUpdateCheckAuthedService } from '../../../service/update_check_authed_service';
import { AddressItemsRecord } from '../../../store/slices/address_info';
import Toast from '../../../components/Toast';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import { useAddressInfo } from '../../../hooks/address_info';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

interface ExtractParam {
  index?: number;
  path?: string;
  balance?: string;
}

interface PrivateKeyAccountType extends PrivateKeyAccountParam, ExtractParam {}

interface MnemonicAccountType extends MnemonicAccountParam, ExtractParam {}

type AccountType = PrivateKeyAccountType | MnemonicAccountType;

interface State {
  data: Record<string, any>;
  accounts: AccountType[];
  oldAccounts: AccountType[];
  selectAddresses: string[];
}

const initialState: State = {
  data: {},
  accounts: [],
  oldAccounts: [],
  selectAddresses: [],
};

type Action =
  | {
      type: 'SET_DATA';
      payload: Partial<State>;
    }
  | {
      type: 'SET_ACCOUNTS';
      payload: State['accounts'];
    }
  | {
      type: 'SET_OLD_ACCOUNTS';
      payload: State['oldAccounts'];
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

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
      };
    case 'SET_ACCOUNTS':
      return {
        ...state,
        accounts: action.payload,
      };
    case 'SET_OLD_ACCOUNTS':
      return {
        ...state,
        oldAccounts: action.payload,
      };
    case 'UPDATE_BALANCE': {
      const accounts = state.accounts;
      const oldAccounts = state.oldAccounts;
      const { address, balance } = action.payload;

      const found = _.concat(accounts, oldAccounts).find((ele) => ele.address == address);
      if (found) {
        found.balance = balance;
      }

      return {
        ...state,
        accounts,
        oldAccounts,
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
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const [state, dispatch] = useReducer(reducer, initialState);

  const isAuthed = useGlobalIsAuthed();
  const { tronWebInstance } = useTronWebInstance();
  const { addressInfo } = useAddressInfo();

  const existAccounts: AddressItemsRecord = addressInfo.addressItems;

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
      const data = getImportWalletRouteParams() || {};
      const { type: importType, pathMode, originText = '', definePath } = data;
      dispatch({ type: 'SET_DATA', payload: data as Partial<State> });
      if (importType === WALLET_IMPORT_TYPE.MNEMONIC) {
        if (_.size(definePath as object) > 0) {
          await getDefinePathAccount(
            tronWebInstance,
            originText,
            definePath as DefinePath,
            dispatch,
          );
        } else if (!_.isArray(pathMode)) {
          await loadNewAccount(tronWebInstance, existAccounts, originText, dispatch);
        } else {
          await loadAccounts(tronWebInstance, originText, pathMode, dispatch);
        }
        await checkOldAccount(tronWebInstance, originText, dispatch);
      } else if (importType === WALLET_IMPORT_TYPE.PRIVATE_KEY) {
        await loadAccountByPrivateKey(tronWebInstance, originText, existAccounts, dispatch);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goChooseAddress = useCallback(() => {
    navigate(PAGES.PAGE_IMPORT_ADDRESS);
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

  const onSubmit = useCallback(async () => {
    const { data, selectAddresses, accounts, oldAccounts } = state;
    if (_.size(selectAddresses) === 0) {
      return;
    }

    const { type: importType, password } = data;
    let { originText, name } = data;
    originText = _.trim(originText);
    name = _.trim(name);

    try {
      if (importType === WALLET_IMPORT_TYPE.PRIVATE_KEY) {
        const importAccounts = _.filter(_.concat(accounts, oldAccounts), ({ address }) => {
          return selectAddresses.includes(address);
        });
        await callCreatePrivateAccountsService(msgNode, {
          name,
          password,
          accounts: importAccounts as PrivateKeyAccountParam[],
        });
      } else if (importType === WALLET_IMPORT_TYPE.MNEMONIC) {
        const importAccounts = _.filter(_.concat(accounts, oldAccounts), ({ address }) => {
          return selectAddresses.includes(address);
        });
        await callCreateMnemonicAccountsService(msgNode, {
          name,
          mnemonic: originText,
          password,
          accounts: importAccounts as MnemonicAccountParam[],
          idKey: 'importName',
        });
      }

      if (
        importType === WALLET_IMPORT_TYPE.PRIVATE_KEY ||
        importType === WALLET_IMPORT_TYPE.MNEMONIC
      ) {
        if (!isAuthed) {
          await callUpdateCheckAuthedService(msgNode);
        } else {
          navigate(PAGES.PAGE_HOMEPAGE);
        }
        clearImportWalletInfo();
      }
    } catch (e: any) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({
          id: e.message,
        }),
      });
    }
  }, [navigate, isAuthed, state, formatMessage]);

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
    existAccounts,
    state,
    goChooseAddress,
    onToggleItem,
    onSubmit: useCheckLoginBeforeAction(onSubmit),
    isAccountExist,
    isAddressSelected,
    hasSelected: _.size(state.selectAddresses) > 0,
  };
};

const getDefinePathAccount = async (
  tronWebInstance: any,
  originText: string,
  definePath: DefinePath,
  dispatch: LocalDispatch,
) => {
  /**
   * customize path: m/44'/195'/13'/0/29 from definePath
   */
  const { accountIndex = 0, addressIndex = 0 } = definePath;
  const path = createDefinePath(accountIndex || 0, addressIndex || 0);
  const { address } = getAccountByDefinePath(originText, path);
  const account: MnemonicAccountType = {
    address,
    accountIndex,
    addressIndex,
    index: addressIndex,
    path: path,
  };

  const newAccounts = [account];
  const addresses = [account.address];

  dispatch({ type: 'SET_ACCOUNTS', payload: newAccounts });
  dispatch({ type: 'SET_SELECT_ADDRESSES', payload: addresses });
  await loadAccountBalance(tronWebInstance, addresses, dispatch);
};

const loadNewAccount = async (
  tronWebInstance: any,
  existAccounts: AddressItemsRecord,
  originText: string,
  dispatch: any,
) => {
  originText = _.trim(originText);
  let newAccounts = [];
  let addresses = [];
  let index = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { address } = getAccountBySeq(originText, index);
    if (!existAccounts[address]) {
      const account: MnemonicAccountType = {
        address,
        index,
        accountIndex: 0,
        addressIndex: index,
      };

      newAccounts = [account];
      addresses = [account.address];
      break;
    }
    index++;
  }
  dispatch({ type: 'SET_ACCOUNTS', payload: newAccounts });
  dispatch({ type: 'SET_SELECT_ADDRESSES', payload: addresses });
  await loadAccountBalance(tronWebInstance, addresses, dispatch);
};

const loadAccounts = async (
  tronWebInstance: any,
  originText: string,
  pathModeArr: number[],
  dispatch: LocalDispatch,
) => {
  /**
   * load specific addressIndexes account
   * pathModeArr:  AddressIndex list
   */
  originText = _.trim(originText);
  const newAccounts = [];
  const addresses = [];
  for (const index of pathModeArr) {
    const { address } = getAccountBySeq(originText, index);

    const account: MnemonicAccountType = {
      address,
      index,
      accountIndex: 0,
      addressIndex: index,
    };

    newAccounts.push(account);
    addresses.push(account.address);
  }
  dispatch({ type: 'SET_ACCOUNTS', payload: newAccounts });
  dispatch({ type: 'SET_SELECT_ADDRESSES', payload: addresses });
  await loadAccountBalance(tronWebInstance, addresses, dispatch);
};

const loadAccountByPrivateKey = async (
  tronWebInstance: any,
  originText: string,
  existAccounts: AddressItemsRecord,
  dispatch: LocalDispatch,
) => {
  originText = _.trim(originText);
  const accounts: PrivateKeyAccountType[] = [];
  const oldAccounts: PrivateKeyAccountType[] = [];
  const addresses = [];
  const selectAddresses = [];
  if (_.size(originText) % 2 === 1) {
    let oldPrivateKey = originText?.substring(0, _.size(originText) - 1);
    if (_.size(oldPrivateKey) > 0) {
      oldPrivateKey = _.padStart(oldPrivateKey, 64, '0');
      const oldAddress = TronWeb.address.fromPrivateKey(originText);
      addresses.push(oldAddress);
      oldAccounts.push({
        privateKey: oldPrivateKey,
        address: oldAddress,
        isOld: true,
      });
    }
  }
  originText = _.padStart(originText, 64, '0');
  const address = TronWeb.address.fromPrivateKey(originText);
  addresses.push(address);

  if (!existAccounts[address]) {
    selectAddresses.push(address);
  }

  accounts.push({
    privateKey: originText,
    address,
    isOld: false,
  });

  dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
  dispatch({ type: 'SET_SELECT_ADDRESSES', payload: selectAddresses });
  dispatch({ type: 'SET_OLD_ACCOUNTS', payload: oldAccounts });
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
    dispatch({
      type: 'UPDATE_BALANCE',
      payload: {
        address,
        balance,
      },
    });
  }
};

const checkOldAccount = async (
  tronWebInstance: any,
  originText: string,
  dispatch: LocalDispatch,
) => {
  originText = _.trim(originText);
  const oldAccounts = [];
  for (let index = 1; index < 5; ++index) {
    const { address } = getAccountAtIndex(originText, index);
    const balance = await tronWebInstance.trx.getBalance(address);
    if (balance > 0) {
      const account: MnemonicAccountType = {
        address,
        index,
        accountIndex: index,
        addressIndex: 0,
        balance: new BigNumber(balance).shiftedBy(-6).toFixed(),
      };
      oldAccounts.push(account);
    }
  }
  dispatch({ type: 'SET_OLD_ACCOUNTS', payload: oldAccounts });
};
