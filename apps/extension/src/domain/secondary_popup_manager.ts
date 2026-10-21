import PAGES from '../constants/pages';
import { redirectPopupToPage } from '../lib/popup';
import { signManager } from './sign_manager';
import { secondaryPopup } from './secondary_popup';
import { requestAccountsManager } from './request_accounts_manager';
import { watchAssetManager } from './watch_asset_manager';
import { badgeManager } from './badge_manager';

class SecondaryPopupManager {
  static #instance: SecondaryPopupManager;

  private constructor() {
    // ignore
  }

  public static getInstance(): SecondaryPopupManager {
    if (!SecondaryPopupManager.#instance) {
      SecondaryPopupManager.#instance = new SecondaryPopupManager();
    }

    return SecondaryPopupManager.#instance;
  }

  public async centralControl() {
    if (requestAccountsManager.existPendingInfos()) {
      await requestAccountsManager.openRequestAccountsSecondaryPopup();
    } else if (signManager.existPendingConfirmations()) {
      await signManager.openSignSecondaryPopup();
    } else if (watchAssetManager.existPendingWatchAsset()) {
      await watchAssetManager.openWatchAssetSecondaryPopup();
    } else {
      await secondaryPopup.close();
      await redirectPopupToPage(PAGES.PAGE_HOMEPAGE);
    }
    await badgeManager.updateBadge();
  }
}
export const secondaryPopupManager = SecondaryPopupManager.getInstance();
