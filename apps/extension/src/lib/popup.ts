import { chromeStorage } from './storage';
import { LATEST_LOCATION, SECONDARY_POPUP_LATEST_LOCATION } from '../constants/storage_keys';
import { getStore } from '../store/store';
import {
  updateCheckRedirect,
  updateCheckSecondaryPopupRedirect,
} from '../store/slices/notification';

export async function redirectPopupToPage(page: string, state: Record<string, any> | null = null) {
  await chromeStorage.setItem(LATEST_LOCATION, {
    pathname: page,
    state,
  });
  getStore().dispatch(updateCheckRedirect());
}

export async function redirectSecondaryPopupToPage(page: string) {
  await chromeStorage.setItem(SECONDARY_POPUP_LATEST_LOCATION, {
    pathname: page,
    state: null,
  });
  getStore().dispatch(updateCheckSecondaryPopupRedirect());
}
