import { useCallback, useEffect, useReducer, useState } from 'react';
import log from 'loglevel';

import { WALLET_EXPORT_TYPE } from './constants';
import { callBackUpService } from '../../../service/backup_service';
import { msgNode } from '../../inst';
import { setGaEvent } from '../../utils/gaUtils';
import { getAccountInfo, setAccountInfo } from '../../../hooks/account_info';
import { supportStorageKey } from '../../../constants/wallet_type';
import PAGES from '../../../constants/pages';
import { useNavigate } from 'react-router';
import { callGetKeyStore } from '../../../service/get_keystore';
import Toast from '../../../components/Toast';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';
import { callGetSelectedAccountService } from '../../../service/get_selected_account_service';
import { callGetAccountRemindStatusService } from '../../../service/get_account_remind_status_service';
import { useAppSelector } from '../../../store/hooks';
import { selectSelectedAddress } from '../../../store/slices/address_info';

export const STAGES = {
  VERIFY_PASSWORD: 0,
  GUIDE: 1,
  SHOW_CONTENT: 2,
};

interface State {
  stage: number;
  isOverlayVisible: boolean;
  showQR: boolean;
  account: object;
  isPasswordValid: boolean;
  exportType: string;
  remind: boolean;
}

const initialState = {
  stage: STAGES.VERIFY_PASSWORD,
  isOverlayVisible: true,
  showQR: false,
  account: {},
  isPasswordValid: false,
  exportType: '',
  remind: false,
};

const reducer = (state: State, action: { type: string; payload?: any }): State => {
  switch (action.type) {
    case 'INIT': {
      return {
        ...state,
        ...action.payload,
      };
    }
    case 'SET_STAGE':
      return {
        ...state,
        stage: action.payload,
      };
    case 'SET_ACCOUNT':
      return {
        ...state,
        account: action.payload,
      };
    case 'TOGGLE_QRCODE':
      return {
        ...state,
        showQR: !state.showQR,
      };
    case 'VALID_PASSWORD':
      return {
        ...state,
        account: action.payload,
        isPasswordValid: true,
        stage: STAGES.GUIDE,
      };
    case 'INVALID_PASSWORD':
      return {
        ...state,
        isPasswordValid: false,
      };
    case 'HIDE_OVERLAY':
      return {
        ...state,
        isOverlayVisible: false,
      };
    default:
      return state;
  }
};

export const useSaveMnemonicBiz = () => {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);
  const [fromPage, setFromPage] = useState<PAGES>();

  const selectedAddress = useAppSelector(selectSelectedAddress);

  //initialize
  useEffect(() => {
    (async () => {
      let stage = STAGES.VERIFY_PASSWORD;
      let isOverlayVisible = true;
      const account: any = {};
      const fromPage = await getAccountInfo(supportStorageKey.fromPage);

      let exportType = WALLET_EXPORT_TYPE.MNEMONIC;
      try {
        const str = await getAccountInfo(supportStorageKey.exportType);
        if (str) {
          exportType = str;
        }
      } catch (e) {
        // ignore
      }

      // add
      try {
        const reLook = await getAccountInfo(supportStorageKey.reLookMnemonic);
        const isReLook = !!reLook;
        const { selected } = await callGetSelectedAccountService(msgNode, {});
        account.mnemonic = selected.selectedAccount?.mnemonicPhase;
        if (isReLook) {
          stage = STAGES.SHOW_CONTENT;
          isOverlayVisible = false;
        }
      } catch (e) {
        // ignore
      } finally {
        await setAccountInfo(supportStorageKey.reLookMnemonic, '');
      }

      const { remind } = await callGetAccountRemindStatusService(msgNode, {
        address: selectedAddress,
      });

      setFromPage(fromPage);
      dispatch({
        type: 'INIT',
        payload: {
          stage,
          account,
          isOverlayVisible,
          exportType,
          remind,
        },
      });
    })();
  }, []);

  const onConfirmPassword = useCallback(
    async (password: string) => {
      if (password) {
        try {
          const { mnemonic, privateKey } = await callBackUpService(msgNode, { password });
          if (mnemonic || privateKey) {
            const account = {
              mnemonic,
              privateKey,
              keystoreStr: '',
            };
            dispatch({ type: 'VALID_PASSWORD', payload: account });
            if (state.exportType === WALLET_EXPORT_TYPE.KEYSTORE) {
              Toast.show({
                icon: 'loading',
                duration: 0,
              });
              const keystoreStr = await callGetKeyStore(msgNode, { password });
              // TODO: get keystore error try catch
              if (keystoreStr) {
                account.keystoreStr = keystoreStr;
                dispatch({ type: 'SET_ACCOUNT', payload: account });
                Toast.hide();
              }
            }
          }
        } catch (e) {
          log.debug('wrong password');
          dispatch({ type: 'INVALID_PASSWORD' });
          setGaEvent(
            'Account Management',
            'Export Account Wrong Password',
            'Export Account Wrong Password',
          );
        }
      }
    },
    [state.exportType],
  );

  const goBack = useCallback(async () => {
    // await setAccountInfo(supportStorageKey.exportType, '');
    // if (
    //   fromPage &&
    //   [PAGES.PAGE_CREATE_WALLET, PAGES.PAGE_HOMEPAGE, PAGES.PAGE_EXPORT_ACCOUNT].includes(fromPage)
    // ) {
    //   navigate(fromPage);
    // }
    navigate(-1);
  }, [navigate, fromPage]);

  const toggleQRCode = useCallback(() => {
    dispatch({ type: 'TOGGLE_QRCODE' });
  }, []);

  const showContent = useCallback(() => {
    dispatch({ type: 'SET_STAGE', payload: STAGES.SHOW_CONTENT });
  }, []);

  const hideOverlay = useCallback(() => {
    dispatch({ type: 'HIDE_OVERLAY' });
  }, []);

  const goNextPage = useCallback(() => {
    if (state.exportType === WALLET_EXPORT_TYPE.MNEMONIC && state.remind) {
      navigate(PAGES.PAGE_CHECK_MNEMONIC);
      return;
    }
    navigate(PAGES.PAGE_HOMEPAGE);
  }, [navigate, state.exportType, state.remind]);

  return {
    state,
    onConfirmPassword: useCheckLoginBeforeAction(onConfirmPassword),
    goBack,
    toggleQRCode,
    showContent,
    hideOverlay,
    goNextPage: useCheckLoginBeforeAction(goNextPage),
  };
};
