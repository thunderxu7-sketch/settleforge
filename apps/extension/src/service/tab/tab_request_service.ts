import log from 'loglevel';

import { DuplexMessage, MessageHub, MessageNode } from '../../lib/bg_msg';
import type { DuplexMessageMetaType } from '../../lib/bg_msg/types';
import { commonRequest } from './handlers/common_request';
import { initializeProvider } from './handlers/initialize_provider';
import { visitedRecord } from './handlers/set_visited';
import { signTransaction, multiSignTransaction } from './handlers/sign_transaction';

const TAB_REQUEST_ACTION_NAME = 'TAB_REQUEST';

export const callTabRequestService = async (msgNode: MessageNode, message: any) => {
  const res = await msgNode.send(new DuplexMessage(TAB_REQUEST_ACTION_NAME, message));
  return res;
};

export const registerTabRequestService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('tab', TAB_REQUEST_ACTION_NAME);

  messageHub.on(TAB_REQUEST_ACTION_NAME, async (message: any, meta: DuplexMessageMetaType) => {
    const { action, data, uuid } = message;
    log.debug('got tab message', action, data);
    switch (action) {
      case 'init': {
        await initializeProvider(uuid, meta);
        break;
      }
      case 'sign': {
        await signTransaction(uuid, data, meta);
        break;
      }
      case 'multiSign': {
        await multiSignTransaction(uuid, data, meta);
        break;
      }
      case 'setVisited': {
        visitedRecord(uuid, data, meta);
        break;
      }
      case 'request': {
        await commonRequest(uuid, data, meta);
        break;
      }
      default: {
        meta.resolve({
          success: false,
          data: 'Unknown method called',
          uuid,
        });
      }
    }
  });
};
