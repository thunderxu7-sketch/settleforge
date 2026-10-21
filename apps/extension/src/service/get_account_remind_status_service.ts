import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';

interface Params {
  address: string;
}

const GET_ACCOUNT_REMIND_STATUS_ACTION_NAME = 'GET_ACCOUNT_REMIND_STATUS';

export const callGetAccountRemindStatusService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(GET_ACCOUNT_REMIND_STATUS_ACTION_NAME, data));
  return res;
};

export const registerGetAccountRemindStatusService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_ACCOUNT_REMIND_STATUS_ACTION_NAME);

  messageHub.on(
    GET_ACCOUNT_REMIND_STATUS_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const { address } = data;
      const remind = await accountManager.getAccountRemindStatus(address);

      meta.resolve({
        remind,
      });
    },
  );
};
