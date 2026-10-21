import _ from 'lodash';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from '../store';

export interface ConnectedWebsiteType {
  origin: string;
  hostname: string;
  websiteName: string;
  websiteIcon: string | null | undefined;
  isSysWhiteWebSite?: boolean;
}

type Address = string;

export interface ConnectedWebsiteInfoState {
  [key: Address]: ConnectedWebsiteType[];
}

interface AddConnectedWebsiteType {
  address: string;
  website: ConnectedWebsiteType;
}

interface RemoveConnectedWebsiteType {
  address: string;
  origin: string;
}

const initialState: ConnectedWebsiteInfoState = {};

export const connectedWebsiteInfoSlice = createSlice({
  name: 'connectedWebsiteInfo',
  initialState,
  reducers: {
    addConnectedWebsite: (state, action: PayloadAction<AddConnectedWebsiteType>) => {
      const { address, website } = action.payload;
      if (!address) {
        return;
      }
      const exitedWebsites = state[address] || [];
      const found = _.find(exitedWebsites, (ele) => ele.origin == website.origin);
      if (!found) {
        state[address] = [...exitedWebsites, website];
      }
    },
    removeConnectedWebsite: (state, action: PayloadAction<RemoveConnectedWebsiteType>) => {
      const { address, origin } = action.payload;
      if (!address) {
        return;
      }
      const exitedWebsites = state[address] || [];
      state[address] = _.reject(exitedWebsites, (ele) => ele.origin == origin);
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      delete state[action.payload];
    },
  },
});

export const { addConnectedWebsite, removeConnectedWebsite, removeAddress } =
  connectedWebsiteInfoSlice.actions;

export const selectConnectedWebsiteInfo = (state: RootState) => state.connectedWebsiteInfo;

export default connectedWebsiteInfoSlice.reducer;
