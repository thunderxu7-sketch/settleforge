import { requestAccountsManager } from './request_accounts_manager';
import { secondaryPopup } from './secondary_popup';
import { signManager } from './sign_manager';
import PAGES from '../constants/pages';
import { redirectPopupToPage, redirectSecondaryPopupToPage } from '../lib/popup';
import { getStore } from '../store/store';
import { updateCheckWatchAsset } from '../store/slices/notification';
import { badgeManager } from './badge_manager';
import { secondaryPopupManager } from './secondary_popup_manager';

class WatchAssetManager {
  static #instance: WatchAssetManager;

  private addresses: string[];

  private constructor() {
    // ignore
    this.addresses = [];
  }

  public static getInstance(): WatchAssetManager {
    if (!WatchAssetManager.#instance) {
      WatchAssetManager.#instance = new WatchAssetManager();
    }

    return WatchAssetManager.#instance;
  }

  public async showAddTokenPopup(address: string) {
    await this.reset();

    if (requestAccountsManager.existPendingInfos()) {
      await requestAccountsManager.openRequestAccountsSecondaryPopup();
      return;
    }

    if (signManager.existPendingConfirmations()) {
      await signManager.openSignSecondaryPopup();
      return;
    }

    this.addresses.push(address);
    await this.openWatchAssetSecondaryPopup();
    await badgeManager.updateBadge();
  }

  async openWatchAssetSecondaryPopup() {
    await secondaryPopup.open(`secondary_popup/secondary_popup.html#${PAGES.PAGE_WATCH_ASSET}`);
    await redirectSecondaryPopupToPage(PAGES.PAGE_WATCH_ASSET);
    await redirectPopupToPage(PAGES.PAGE_WATCH_ASSET);
    getStore().dispatch(updateCheckWatchAsset());
  }

  private async reset() {
    this.addresses = [];
    await badgeManager.updateBadge();
  }

  public pendingWatchAssetLength() {
    return this.addresses.length;
  }

  public existPendingWatchAsset() {
    return this.addresses.length > 0;
  }

  public getWatchAsset() {
    return this.addresses || [];
  }

  public async closePopup() {
    await this.reset();
    await secondaryPopupManager.centralControl();
  }

  public notifySecondaryPopupClose() {
    getStore().dispatch(updateCheckWatchAsset());
  }
}

export const watchAssetManager = WatchAssetManager.getInstance();
