import { useCallback, useEffect, useReducer } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { msgNode } from '../../inst';
import {
  selectCurrency,
  selectLanguage,
  selectLedgerConnection,
} from '../../../store/slices/settings';
import { callSignOutService } from '../../../service/sign_out_service';
import {
  callCurrencyService,
  callLanguageService,
  callLedgerConnectionService,
} from '../../../service/settings_service';
import { useAppSelector } from '../../../store/hooks';
import { clearLatestLocationState, useSaveLatestLocation } from '../../../hooks/location';

import { CURRENCY_OPTIONS, LANGUAGE_OPTIONS, LEDGER_CONNECTION_OPTIONS } from './constants';
import { setGaEvent } from '../../utils/gaUtils';
import PAGES from '../../../constants/pages';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

interface State {
  currency: boolean;
  language: boolean;
  autoLock: boolean;
  ledgerConnection: boolean;
}

const initialState: State = {
  currency: false,
  language: false,
  autoLock: false,
  ledgerConnection: false,
};

type RadioID = 'currency' | 'language' | 'autoLock' | 'ledgerConnection';

type Action = {
  type: 'ON_CLICK_RADIO_ROW';
  payload: RadioID;
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ON_CLICK_RADIO_ROW':
      return {
        ...state,
        ...initialState,
        [action.payload]: !state[action.payload],
      };

    default:
      return state;
  }
};

export const useSetting = () => {
  const navigate = useNavigate();
  useSaveLatestLocation();

  const location = useLocation();
  const { rowId } = (location.state as any) ?? {};

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (rowId) {
      dispatch({ type: 'ON_CLICK_RADIO_ROW', payload: rowId });
    }
  }, []);

  const goBack = useCallback(() => {
    navigate(PAGES.PAGE_HOMEPAGE);
  }, [navigate]);

  const onClickRadioRow = useCallback((id: RadioID) => {
    dispatch({ type: 'ON_CLICK_RADIO_ROW', payload: id });
    if (id === 'currency') {
      setGaEvent('Setting', 'Click Currency', 'Click Currency');
    } else if (id === 'language') {
      setGaEvent('Setting', 'Click Language', 'Click Language');
    }
  }, []);

  const onClickLogOut = useCallback(async () => {
    await clearLatestLocationState();
    await callSignOutService(msgNode);
  }, []);

  /** currency setting **/
  const currencySelectedValue = useAppSelector(selectCurrency);

  const onChangeCurrency = useCallback(async (value: string): Promise<void> => {
    await callCurrencyService(msgNode, { value });
  }, []);

  const getSelectedCurrency = () => {
    return CURRENCY_OPTIONS.find((item) => {
      return item.value === currencySelectedValue;
    })!.text;
  };

  /** language setting **/
  const languageSelectedValue = useAppSelector(selectLanguage);

  const onChangeLanguage = useCallback(async (value: string): Promise<void> => {
    setGaEvent(
      'Currency',
      'Switch Currency',
      `${value === 'en' ? 'English' : value === 'zh' ? 'Chinese' : 'Japanese'}`,
    );
    await callLanguageService(msgNode, { value });
  }, []);

  const getSelectedLanguage = (): string => {
    return LANGUAGE_OPTIONS.find((item) => {
      return item.value === languageSelectedValue;
    })!.text;
  };

  /* ledger connection setting */
  const ledgerConnectionSelectedValue = useAppSelector(selectLedgerConnection);

  const onChangeLedgerConnection = useCallback(async (value: string): Promise<void> => {
    await callLedgerConnectionService(msgNode, { value });
  }, []);

  const getSelectedLedgerConnection = () => {
    return LEDGER_CONNECTION_OPTIONS.find((item) => {
      return item.value === ledgerConnectionSelectedValue;
    })!.text;
  };

  return {
    state,
    goBack,
    onClickRadioRow,
    onClickLogOut,

    currencySelectedValue,
    onChangeCurrency: useCheckLoginBeforeAction(onChangeCurrency),
    getSelectedCurrency,

    languageSelectedValue,
    onChangeLanguage: useCheckLoginBeforeAction(onChangeLanguage),
    getSelectedLanguage,

    ledgerConnectionSelectedValue,
    onChangeLedgerConnection: useCheckLoginBeforeAction(onChangeLedgerConnection),
    getSelectedLedgerConnection,
  };
};
