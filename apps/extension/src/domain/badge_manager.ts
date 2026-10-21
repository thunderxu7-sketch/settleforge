import { watchAssetManager } from './watch_asset_manager';
import { signManager } from './sign_manager';

class BadgeManager {
  static #instance: BadgeManager;

  private constructor() {
    // ignore
  }

  public static getInstance(): BadgeManager {
    if (!BadgeManager.#instance) {
      BadgeManager.#instance = new BadgeManager();
    }

    return BadgeManager.#instance;
  }

  async updateBadge(color = '#FF6600') {
    const count =
      watchAssetManager.pendingWatchAssetLength() + signManager.pendingConfirmationsLength();
    let text = '';
    if (count > 0) {
      text = count.toString();
    }
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
  }
}

export const badgeManager = BadgeManager.getInstance();
