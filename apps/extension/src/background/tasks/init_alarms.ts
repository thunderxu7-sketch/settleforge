import log from 'loglevel';

import { accountManager } from '../../domain/account_manager';
import { getStore } from '../../store/store';
import { updateCheckAuthed } from '../../store/slices/notification';
import { sendNotifyEvent } from '../../lib/notify_event';

const CHECK_AUTHED_ALARM = 'CHECK_AUTHED_ALARM';

const CHECK_AUTHED_ALARM_PERIOD_MINUTES = 0.08333;

export const initAlarms = () => {
  chrome.alarms.create(CHECK_AUTHED_ALARM, { periodInMinutes: CHECK_AUTHED_ALARM_PERIOD_MINUTES });

  chrome.alarms.onAlarm.addListener((alarm) => {
    switch (alarm.name) {
      case CHECK_AUTHED_ALARM: {
        checkAuthed().then();
        break;
      }
      default:
        return;
    }
  });
};

async function checkAuthed() {
  const isLocked = accountManager.isLocked();
  log.debug(`${Date.now()} keeping service worker alive, account is Locked:, ${isLocked}`);

  // send to login page
  if (isLocked) {
    getStore().dispatch(updateCheckAuthed());

    await sendNotifyEvent('changeAddress', { address: false, name: false, type: false });
  }
}

export function setCache() {
  // Local-only build: no remote phishing-list or asset cache refresh.
}
