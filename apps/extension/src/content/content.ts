import log from 'loglevel';
import { inject } from './inject';
import { Postman } from './postman';
import { keepalive } from './keepalive';

// @ts-ignore
log.setDefaultLevel(`${__LOGGER_LEVEL__}`);

(async () => {
  keepalive();
  const postman = new Postman();
  await postman.startWork();

  inject('injected/injected.js');
})();
