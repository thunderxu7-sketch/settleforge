import _ from 'lodash';
import { useCallback, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router';

import { msgNode } from '../../inst';
import { useAddressInfo } from '../../../hooks/address_info';
import {
  getNewHDAddressParams,
  NewHDAddressParams,
  setNewHDAddressParams,
} from '../../../service/importWalletInfo';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';
import { callGetMnemonicAccountsService } from '../../../service/get_mnemonic_accounts_service';
import type { StorageMnemonicAccountType } from '../../../domain/storage_account';
import { useAppSelector } from '../../../store/hooks';
import { selectAddressInfo } from '../../../store/slices/address_info';

interface State {
  accounts: any[];
  originAddress: string;
  originName: string;
  remind: boolean;
}

const initialState: State = {
  accounts: [],
  originAddress: '',
  originName: '',
  remind: false,
};

export interface Account {
  accountIndex: number;
  address: string;
  addressIndex: number;
  name: string;
  relatedCount: number;
  remind?: boolean;
}

const reducer = (state: State, action: { type: string; payload?: any }) => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        ...action.payload,
      };
    case 'SELECT_ROW':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

export const useSwitchSeedBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { getNameByAddress } = useAddressInfo();
  const navigate = useNavigate();
  const addressInfo = useAppSelector(selectAddressInfo);

  // initialize
  useEffect(() => {
    (async () => {
      //const { selected } = propsAccounts;

      const data = getNewHDAddressParams() || {};

      const { selectedAddress } = addressInfo;
      const { originAddress, originName } = data as NewHDAddressParams;

      const { mnemonicAccounts } = await callGetMnemonicAccountsService(msgNode, {});

      const accounts: Account[] = [];
      mnemonicAccounts.forEach((account: StorageMnemonicAccountType) => {
        let address = selectedAddress;
        let detail = account.addressDetails[address];

        if (!detail) {
          address = originAddress;
          detail = account.addressDetails[address];
        }

        if (!detail) {
          const firstItem = Object.entries(account.addressDetails).sort((a, b) => {
            const left = a[1];
            const right = b[1];
            if (left.accountIndex < right.accountIndex) {
              return -1;
            } else if (left.accountIndex > right.accountIndex) {
              return 1;
            } else {
              return left.addressIndex - right.addressIndex;
            }
          })[0];
          address = firstItem[0];
          detail = firstItem[1];
        }

        const tempAccount: Account = {
          address,
          relatedCount: _.size(account.addressDetails),
          accountIndex: detail.accountIndex,
          addressIndex: detail.addressIndex,
          name: getNameByAddress(address),
        };
        accounts.push(tempAccount);
      });

      dispatch({
        type: 'INIT',
        payload: {
          accounts,
          originAddress,
          originName,
          // remind,
        },
      });
    })();
  }, []);

  const onSelectRow = useCallback((account: Account) => {
    dispatch({
      type: 'SELECT_ROW',
      payload: {
        originAddress: account.address,
        originName: account.name,
        remind: account.remind,
      },
    });
  }, []);

  const onSubmit = useCallback(() => {
    setNewHDAddressParams({
      originAddress: state.originAddress,
      originName: state.originName,
    });
    navigate(-1);
  }, [state.originAddress, state.originName]);

  return {
    state,
    onSubmit: useCheckLoginBeforeAction(onSubmit),
    onSelectRow,
  };
};
