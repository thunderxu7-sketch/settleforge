import { useCallback, useEffect, useReducer } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';
import _ from 'lodash';

import Toast from '../../../components/Toast';
import {
  clearImportWalletInfo,
  getNewHDAddressParams,
  setNewHDAddressParams,
} from '../../../service/importWalletInfo';
import { msgNode } from '../../inst';
import PAGES from '../../../constants/pages';
import { useAddressInfo } from '../../../hooks/address_info';
import { callGetNewAddressInfoService } from '../../../service/get_new_address_info_service';
import { callCreateDerivedAccountService } from '../../../service/create_derived_address_service';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';
import { callGetAccountRemindStatusService } from '../../../service/get_account_remind_status_service';

export interface DeriveAccountType {
  name: string;
  path: string;
  address: string;
  accountIndex: number;
  addressIndex: number;
}

interface State {
  isLoading: boolean;
  isConfirmModalVisible: boolean;
  deriveAccount: DeriveAccountType | null;
  originAddress: string;
  originName: string;
  isNameError: boolean;
  remind: boolean;
  name: string;
  mnemonicAccountCount: number;
}

const initialState: State = {
  isLoading: true,
  isConfirmModalVisible: false,
  deriveAccount: null,
  originAddress: '',
  originName: '',
  isNameError: false,
  remind: false,
  name: '',
  mnemonicAccountCount: 1,
};

const reducer = (state: State, action: { type: string; payload?: any }): State => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        ...action.payload,
      };
    case 'TOGGLE_CONFIRM_MODAL':
      return {
        ...state,
        isConfirmModalVisible: !state.isConfirmModalVisible,
      };
    case 'UPDATE_NAME':
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

export const useNewHDAddressBiz = () => {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);

  const { formatMessage } = useIntl();

  const { checkNameExist } = useAddressInfo();

  // initialize
  useEffect(() => {
    (async () => {
      Toast.show({ icon: 'loading' });
      const fromAddress = getNewHDAddressParams()?.originAddress;

      const accountInfo = await callGetNewAddressInfoService(msgNode, {
        fromAddress: fromAddress,
      });

      const deriveAccount: DeriveAccountType = {
        name: accountInfo.newAddressItem.name,
        path: "m/44'/195'/0'/0/" + accountInfo.newAddressItem.addressIndex,
        address: accountInfo.newAddressItem.address,
        accountIndex: accountInfo.newAddressItem.accountIndex,
        addressIndex: accountInfo.newAddressItem.addressIndex,
      };

      const {
        preAddressItem: { address: originAddress, name: originName },
        mnemonicAccountCount,
      } = accountInfo;

      const { remind } = await callGetAccountRemindStatusService(msgNode, {
        address: originAddress,
      });

      dispatch({
        type: 'INIT',
        payload: {
          deriveAccount,
          originAddress,
          originName,
          remind,
          name: deriveAccount.name || '',
          mnemonicAccountCount,
          isLoading: false,
        },
      });
      Toast.hide();
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleConfirmModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_CONFIRM_MODAL' });
  }, []);

  const onSubmit = useCallback(async () => {
    if (state.isLoading) {
      return;
    }
    const { deriveAccount, originAddress, name } = state;
    const nameTrimmed = _.trim(name);
    if (checkNameExist(nameTrimmed)) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'WALLET.IMPORT.NAME_REPEAT.ERROR' }),
      });
      return;
    }
    if (_.size(nameTrimmed) > 0) {
      Toast.show({
        icon: 'loading',
      });
      try {
        await callCreateDerivedAccountService(msgNode, {
          fromAddress: originAddress, // derive from which address
          name: nameTrimmed,
          address: deriveAccount!.address,
          accountIndex: deriveAccount!.accountIndex,
          addressIndex: deriveAccount!.addressIndex,
        });
        Toast.hide();
        clearImportWalletInfo();
        navigate(PAGES.PAGE_HOMEPAGE);
      } catch (e: any) {
        Toast.show({
          icon: 'fail',
          content: formatMessage({ id: e.message }),
        });
      } finally {
        setTimeout(Toast.hide, 5000);
      }
    }
  }, [navigate, state, checkNameExist, formatMessage]);

  const switchSeed = useCallback(() => {
    setNewHDAddressParams({
      originAddress: state.originAddress,
      originName: state.originName,
    });
    navigate(PAGES.PAGE_SWITCH_SEED);
  }, [navigate, state.originAddress, state.originName]);

  const onChangeWalletName = useCallback((e: any) => {
    const trimmed = e.target.value.replace(/\s{2,}/g, ' ');
    dispatch({ type: 'UPDATE_NAME', payload: trimmed });
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

  const gotoManualPath = useCallback(() => {
    const routeParams = {
      originAddress: state.originAddress,
      originName: state.originName,
      name: state.name,
    };
    setNewHDAddressParams(routeParams);
    navigate(PAGES.PAGE_MANUAL_PATH);
  }, [navigate, state.originAddress, state.originName, state.name]);

  return {
    state,

    toggleConfirmModal,
    onSubmit: useCheckLoginBeforeAction(onSubmit),
    switchSeed,
    onChangeWalletName,
    gotoManualPath,
  };
};
