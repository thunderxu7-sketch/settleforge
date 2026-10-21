import log from 'loglevel';
import 'timers';

import { MessageHub } from '../lib/bg_msg';
import { initStore } from '../store/store';
import { initAlarms, setCache } from './tasks/init_alarms';
import { initDeviceId } from './tasks/init_device_id';
import { initLanguage } from './tasks/init_language';
import { registerAll } from '../service';
import { addInstalledListener } from './tasks/on_installed';
import { transferRecordManager } from '../domain/transfer_record_manager';
import { badgeManager } from '../domain/badge_manager';

// @ts-ignore
log.setDefaultLevel(`${__LOGGER_LEVEL__}`);

const init = async () => {
  log.debug('background script init start');
  addInstalledListener();
  await initStore();
  const messageHub = new MessageHub();
  registerAll(messageHub);

  messageHub.on('popup:connect', async () => {
    // TODO
  });

  messageHub.on('popup:disconnect', () => {
    // TODO
  });

  initAlarms();
  await initLanguage();
  await initDeviceId();

  messageHub.startListening();

  setCache();
  badgeManager.updateBadge().then();
  transferRecordManager.init();
  log.debug('background script init end');
};

init().then();
