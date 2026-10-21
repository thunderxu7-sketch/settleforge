import { createStore } from 'redux';
import { combineReducers } from '@reduxjs/toolkit';
import storeCreatorFactory from 'reduxed-chrome-storage';

import settingsReducer from './slices/settings';
import pricesReducer from './slices/prices';
import dappListReducer from './slices/dapp_list';
import addressBookReducer from './slices/address_book';
import addressInfoReducer from './slices/address_info';
import nodeManagementReducer from './slices/node_management';
import notificationReducer from './slices/notification';
import connectedWebsiteInfoReducer from './slices/connected_website';
import transferRecordReducer from './slices/transfer_record';
import multiSignInfoReducer from './slices/multi_sign';

const rootReducer = combineReducers({
  notification: notificationReducer,
  settings: settingsReducer,
  prices: pricesReducer,
  dappList: dappListReducer,
  addressBook: addressBookReducer,
  addressInfo: addressInfoReducer,
  nodeManagement: nodeManagementReducer,
  connectedWebsiteInfo: connectedWebsiteInfoReducer,
  transferRecord: transferRecordReducer,
  multiSignInfo: multiSignInfoReducer,
});

let store = createStore(rootReducer);
let inited = false;

export const initStore = async () => {
  if (inited) {
    return store;
  }

  const asyncStoreCreator = storeCreatorFactory({
    createStore,
    bufferLife: 10,
  });

  store = await asyncStoreCreator((state, action) => {
    if (action.type === 'RESET_APP') {
      state = undefined;
    }
    // @ts-ignore
    return rootReducer(state, action);
  });

  inited = true;
  return store;
};

export function getStore() {
  if (!inited) {
    throw Error('store not initialized');
  }
  return store;
}

export const testStore = createStore((state, action) => {
  if (action.type === 'RESET_APP') {
    state = undefined;
  }
  // @ts-ignore
  return rootReducer(state, action);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
