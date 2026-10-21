import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface PriceInfoType {
  CNY: number;
  USD: number;
}

export interface PricesState {
  priceList: PriceInfoType;
}

const initialState: PricesState = {
  priceList: { CNY: 0, USD: 0 },
};

export const pricesSlice = createSlice({
  name: 'prices',
  initialState,
  reducers: {
    updatePrices: (state, action: PayloadAction<PricesState>) => action.payload,
  },
});

export const { updatePrices } = pricesSlice.actions;

export const selectPrices = (state: RootState) => state.prices;

export default pricesSlice.reducer;
