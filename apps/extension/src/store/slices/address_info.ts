import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';

import { RootState } from '../store';

export interface AddressItemType {
  name: string;
  address: string;
  activeTime: number;
  createdTime: number;
}

export interface AddressItemsRecord {
  [key: string]: AddressItemType;
}

export interface AddressInfoState {
  addressItems: AddressItemsRecord;
  selectedAddress: string;
}

const initialState: AddressInfoState = {
  addressItems: {},
  selectedAddress: '',
};

export const addressInfoSlice = createSlice({
  name: 'addressInfo',
  initialState,
  reducers: {
    updateAddressItems: (state, action: PayloadAction<AddressItemType[]>) => {
      const newItems = Object.fromEntries(action.payload.map((ele) => [ele.address, ele]));
      state.addressItems = {
        ...state.addressItems,
        ...newItems,
      };
    },
    updateAddressItem: (state, action: PayloadAction<AddressItemType>) => {
      const newItem = action.payload;
      state.addressItems = {
        ...state.addressItems,
        [newItem.address]: newItem,
      };
    },
    deleteAddressItem: (
      state,
      action: PayloadAction<{ selectedAddress: string; deletedAddress: string }>,
    ) => {
      state.selectedAddress = action.payload.selectedAddress;
      state.addressItems = _.omit(state.addressItems, action.payload.deletedAddress);
    },
    updateSelectedAddress: (state, action: PayloadAction<string>) => {
      state.selectedAddress = action.payload;
      if (state.addressItems[action.payload]) {
        state.addressItems[action.payload].activeTime = Date.now();
      }
    },
  },
});

export const { updateAddressItem, updateAddressItems, deleteAddressItem, updateSelectedAddress } =
  addressInfoSlice.actions;

export const selectAddressInfo = (state: RootState) => state.addressInfo;
export const selectSelectedAddress = (state: RootState) => state.addressInfo.selectedAddress;

export default addressInfoSlice.reducer;
