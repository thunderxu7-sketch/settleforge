import { useCallback, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router';

import { msgNode } from '../../inst';
import { callSignInService } from '../../../service/sign_in_service';
import PAGES from '../../../constants/pages';
import { useGlobalHasAddress, useGlobalIsAuthed } from '../../../hooks/auth';
import { setGaEvent } from '../../utils/gaUtils';
import { useAddressInfo } from '../../../hooks/address_info';
import { setAccountInfo } from '../../../hooks/account_info';
import { supportStorageKey } from '../../../constants/wallet_type';
import { callResetAppService } from '../../../service/reset_app_service';
import { clearImportWalletInfo } from '../../../service/importWalletInfo';
import { getLocationState } from '../../../hooks/location';
import Toast from '../../../components/Toast';

interface State {
  isProcessing: boolean;
  password: string;
  isPasswordValid: boolean;
  isWarningVisible: boolean;
  errorMsgID: string;
  nextPage: 'import' | 'create' | null;
}

const initialState: State = {
  isProcessing: false,
  password: '',
  isPasswordValid: false,
  isWarningVisible: false,
  errorMsgID: '',
  nextPage: null,
};

type Action =
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'UPDATE_PASSWORD'; payload: string }
  | { type: 'UPDATE_ERROR_MSG_ID'; payload: string }
  | { type: 'SHOW_WARNING'; payload: State['nextPage'] }
  | { type: 'HIDE_WARNING' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };
    case 'UPDATE_PASSWORD':
      return {
        ...state,
        password: action.payload,
        isPasswordValid: action.payload.trim().length > 0,
      };
    case 'UPDATE_ERROR_MSG_ID':
      return {
        ...state,
        errorMsgID: action.payload,
      };
    case 'SHOW_WARNING':
      return {
        ...state,
        isWarningVisible: true,
        nextPage: action.payload,
      };
    case 'HIDE_WARNING':
      return {
        ...state,
        isWarningVisible: false,
        nextPage: null,
      };
    default:
      return state;
  }
};

export const useLoginBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  const isAuthed = useGlobalIsAuthed();

  const { addressInfo } = useAddressInfo();

  useEffect(() => {
    /**
     * Only applies in the following cases:
     * Unlimited time toast, at this time, because the chrome v3 mechanism disconnects the link
     */
    setTimeout(() => {
      Toast.hide();
    }, 2000);
  }, []);

  const hasAddress = useGlobalHasAddress();
  useEffect(() => {
    if (!hasAddress) navigate(PAGES.PAGE_GUIDE);
  }, [hasAddress, navigate]);

  useEffect(() => {
    (async () => {
      if (isAuthed) {
        navigate(PAGES.PAGE_HOMEPAGE, { replace: true });

        const locationRes = await getLocationState();
        if (locationRes) {
          // wait component init
          setTimeout(() => {
            navigate(locationRes.pathname, { state: locationRes.state });
          }, 50);
        }

        setGaEvent('Ledger', 'Login', addressInfo.selectedAddress);
        return;
      }
    })();
  }, [navigate, isAuthed, addressInfo.selectedAddress]);

  const updatePassword = useCallback((value: string) => {
    dispatch({ type: 'UPDATE_PASSWORD', payload: value });
  }, []);

  const checkPassword = useCallback(async () => {
    if (state.password == '') {
      return;
    }
    dispatch({ type: 'SET_PROCESSING', payload: true });
    try {
      await callSignInService(msgNode, { password: state.password });
    } catch (e: any) {
      dispatch({ type: 'UPDATE_ERROR_MSG_ID', payload: e.message });
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, [navigate, state.password]);

  const loginByOtherWay = useCallback(() => {
    dispatch({ type: 'SHOW_WARNING', payload: 'import' });
  }, []);

  const createNewWallet = useCallback(() => {
    dispatch({ type: 'SHOW_WARNING', payload: 'create' });
  }, []);

  const hideWaning = useCallback(() => {
    dispatch({ type: 'HIDE_WARNING' });
  }, []);

  const onConfirmNextPage = useCallback(async () => {
    await callResetAppService(msgNode);
    clearImportWalletInfo();
    await setAccountInfo(supportStorageKey.fromPage, PAGES.PAGE_GUIDE);
    if (state.nextPage == 'import') {
      navigate(PAGES.PAGE_IMPORT_WALLET);
    } else if (state.nextPage == 'create') {
      navigate(PAGES.PAGE_CREATE_WALLET);
    }
  }, [navigate, state.nextPage]);

  return {
    state,
    updatePassword,
    checkPassword,
    loginByOtherWay,
    createNewWallet,
    hideWaning,
    onConfirmNextPage,
  };
};
