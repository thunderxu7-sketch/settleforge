import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface AddressBookItemType {
  address: string;
  name: string;
  remarks: string;
}
export interface AddressBookState {
  [k: string]: AddressBookItemType;
}

const initialState: AddressBookState = {};

export const addressBookSlice = createSlice({
  name: 'addressBook',
  initialState,
  reducers: {
    setAddressBookItem: (state, action: PayloadAction<AddressBookItemType>) => {
      const { address } = action.payload;
      state[address] = action.payload;
    },
    deleteAddressBookItem: (state, action: PayloadAction<string>) => {
      const address = action.payload;
      delete state[address];
    },
  },
});

export const { setAddressBookItem, deleteAddressBookItem } = addressBookSlice.actions;

export const selectAddressBook = (state: RootState) => state.addressBook;

export default addressBookSlice.reducer;
