import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from '../store';

export interface Transaction {
  status: boolean;
}

type Hash = string;
type Address = string;

export interface MultiSignTransactions {
  [key: Hash]: Transaction;
}

interface MultiSignInfoState {
  [Key: Address]: MultiSignTransactions;
}

const initialState: MultiSignInfoState = {};

export const multiSignInfoSlice = createSlice({
  name: 'multiSignInfo',
  initialState,
  reducers: {
    updateForAddress: (state, action: PayloadAction<MultiSignInfoState>) => {
      Object.assign(state, action.payload);
    },
    removeAddress: (state, action: PayloadAction<Address>) => {
      delete state[action.payload];
    },
  },
});

export const { updateForAddress, removeAddress } = multiSignInfoSlice.actions;

export const selectMultiSignInfo = (state: RootState) => state.multiSignInfo;

export default multiSignInfoSlice.reducer;
