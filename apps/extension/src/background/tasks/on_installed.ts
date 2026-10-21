import log from 'loglevel';

import { chromeStorage } from '../../lib/storage';
import { LATEST_LOCATION, SECONDARY_POPUP_LATEST_LOCATION } from '../../constants/storage_keys';

export function addInstalledListener() {
  chrome.runtime.onInstalled.addListener((details) => {
    const currentVersion = chrome.runtime.getManifest().version;
    const previousVersion = details.previousVersion;
    const reason = details.reason;

    log.debug(`Previous Version: ${previousVersion}`);
    log.debug(`Current Version: ${currentVersion}`);

    switch (reason) {
      case 'install':
        log.debug('New User installed the extension.');
        break;
      case 'update':
        log.debug('User has updated their extension.');
        cleanLatestLocation().then();
        break;
      case 'chrome_update':
      case 'shared_module_update':
      default:
        log.debug('Other install events within the browser');
        break;
    }
  });
}

async function cleanLatestLocation() {
  log.debug('**** clean latest location');
  await chromeStorage.removeItems([LATEST_LOCATION, SECONDARY_POPUP_LATEST_LOCATION]);
}
