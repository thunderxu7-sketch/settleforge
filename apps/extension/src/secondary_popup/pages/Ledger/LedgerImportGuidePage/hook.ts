import { useCallback, useEffect, useReducer } from 'react';
import { useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';
import _ from 'lodash';

import { LedgerHidStatusChecker } from '../../../../lib/ledger';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { sleep } from '../../../../lib/async_func';
import type { PageDeviceStatusType } from './types';
import Toast from '../../../../components/Toast';
import { callLedgerConfirmService } from '../../../../service/get_ledger_confirm';
import { msgNode } from '../../../../popup/inst';
import { getAccountInfo, setAccountInfo } from '../../../../hooks/account_info';
import { updateCheckLedgerImportLoading } from '../../../../store/slices/notification';
import { selectAddressInfo } from '../../../../store/slices/address_info';
import { redirectPopupToPage } from '../../../../lib/popup';
import PAGES from '../../../../constants/pages';

interface State {
  deviceStatus: PageDeviceStatusType;
  isConnecting: boolean;
  isRetry: boolean;
  isConfirmationVisible: boolean;
}

const initialState: State = {
  deviceStatus: 'UNKNOWN',
  isConnecting: false,
  isRetry: false,
  isConfirmationVisible: false,
};

type Action =
  | {
      type: 'SET_DEVICE_STATE';
      payload: PageDeviceStatusType;
    }
  | {
      type: 'SET_CONNECTING';
      payload: boolean;
    }
  | {
      type: 'SET_RETRY';
      payload: boolean;
    }
  | {
      type: 'TOGGLE_CONFIRMATION_VISIBLE';
    };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_DEVICE_STATE':
      return {
        ...state,
        deviceStatus: action.payload,
      };
    case 'SET_CONNECTING':
      return {
        ...state,
        isConnecting: action.payload,
      };
    case 'SET_RETRY':
      return {
        ...state,
        isRetry: action.payload,
      };
    case 'TOGGLE_CONFIRMATION_VISIBLE':
      return {
        ...state,
        isConfirmationVisible: !state.isConfirmationVisible,
      };
    default:
      return state;
  }
};

export const useLedgerImportBiz = () => {
  const { formatMessage } = useIntl();
  const appDispatch = useAppDispatch();
  const location = useLocation();

  const addressInfo = useAppSelector(selectAddressInfo);
  const hasAddress = _.size(addressInfo.addressItems) > 0;

  const [state, dispatch] = useReducer(reducer, initialState);

  const checkStatus = useCallback(async () => {
    if (state.isConnecting) {
      return;
    }
    dispatch({ type: 'SET_CONNECTING', payload: true });

    // some computer is slow, we need to wait ledger hardware connected
    if (state.deviceStatus == 'UNAUTHORIZED') {
      await sleep(3000);
    }

    const { deviceStatus: newDeviceStatus } = await LedgerHidStatusChecker.getStatus();

    dispatch({ type: 'SET_DEVICE_STATE', payload: newDeviceStatus });
    dispatch({ type: 'SET_CONNECTING', payload: false });

    if (
      state.deviceStatus == newDeviceStatus ||
      (state.deviceStatus == 'UNKNOWN' && newDeviceStatus == 'LOCKED')
    ) {
      dispatch({ type: 'SET_RETRY', payload: true });
    } else {
      dispatch({ type: 'SET_RETRY', payload: false });
    }

    if (newDeviceStatus == 'AUTHORIZED') {
      Toast.show({
        icon: 'success',
        duration: 3000,
        content: formatMessage({
          id: 'WALLET.LEDGER.CONNECT.STEP_3.LOAD_SUCCESS',
        }),
        // maxWidth: 140,
        afterClose: () => {
          window.close();
        },
      });

      const params = new URLSearchParams(location.search);
      if (
        params.get('from_page') == PAGES.PAGE_SIGN ||
        params.get('from_page') == PAGES.PAGE_TRANSFER_STEP_3
      ) {
        // ignore
      } else {
        const ledgerGuideFrom = await getAccountInfo('ledgerGuideFrom');
        if (ledgerGuideFrom === 'loadAccount') {
          const result = await callLedgerConfirmService(msgNode, {
            redirectPage: PAGES.PAGE_LEDGER_CONFIRM,
          });
          if (result) {
            await setAccountInfo('ledgerGuideFrom', '');
          }
        }
      }
    }
  }, [state.deviceStatus, state.isConnecting]);

  useEffect(() => {
    window.addEventListener('beforeunload', () => {
      appDispatch(updateCheckLedgerImportLoading());
    });
  }, []);

  const toggleConfirmationVisible = useCallback(() => {
    dispatch({ type: 'TOGGLE_CONFIRMATION_VISIBLE' });
  }, []);

  const gotoSettingPage = useCallback(async () => {
    await redirectPopupToPage(PAGES.PAGE_SETTINGS, {
      rowId: 'ledgerConnection',
    });
    window.close();
  }, []);

  return {
    state,
    hasAddress,
    checkStatus,
    toggleConfirmationVisible,
    gotoSettingPage,
  };
};
