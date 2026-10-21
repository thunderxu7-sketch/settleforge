import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LEDGER_WEB_HID } from '../../popup/pages/SettingsPage/constants';
import { RootState } from '../store';

export type CurrencyType = 'USD' | 'CNY';

interface SettingsState {
  currency: CurrencyType;
  language: string;
  autoLock: number;
  ledgerConnection: string;
  deviceID: string;
  balanceVisible: boolean;
}

const initialState: SettingsState = {
  currency: 'USD',
  language: 'en',
  autoLock: 0,
  ledgerConnection: LEDGER_WEB_HID,
  deviceID: '',
  balanceVisible: true,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateCurrency: (state, action: PayloadAction<'USD' | 'CNY'>) => {
      state.currency = action.payload;
    },
    updateLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    updateAutoLock: (state, action: PayloadAction<number>) => {
      state.autoLock = action.payload;
    },
    updateLedgerConnection: (state, _action: PayloadAction<string>) => {
      state.ledgerConnection = LEDGER_WEB_HID;
    },
    updateDeviceID: (state, action: PayloadAction<string>) => {
      state.deviceID = action.payload;
    },
    toggleBalanceVisible: (state) => {
      state.balanceVisible = !state.balanceVisible;
    },
  },
});

export const {
  updateCurrency,
  updateLanguage,
  updateAutoLock,
  updateLedgerConnection,
  updateDeviceID,
  toggleBalanceVisible,
} = settingsSlice.actions;

export const selectCurrency = (state: RootState) => state.settings.currency;
export const selectLanguage = (state: RootState) => state.settings.language;
export const selectAutoLock = (state: RootState) => state.settings.autoLock;
export const selectLedgerConnection = (_state: RootState) => LEDGER_WEB_HID;
export const selectBalanceVisible = (state: RootState) => state.settings.balanceVisible;

export default settingsSlice.reducer;
