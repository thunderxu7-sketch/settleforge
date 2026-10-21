import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { sleep } from '../lib/async_func';

interface Params {
  address: string;
  remind: boolean;
}

const UPDATE_ACCOUNT_REMIND_STATUS_ACTION_NAME = 'UPDATE_ACCOUNT_REMIND_STATUS';

export const callUpdateAccountRemindStatusService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(UPDATE_ACCOUNT_REMIND_STATUS_ACTION_NAME, data));
  return res;
};

export const registerUpdateAccountRemindStatusService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', UPDATE_ACCOUNT_REMIND_STATUS_ACTION_NAME);

  messageHub.on(
    UPDATE_ACCOUNT_REMIND_STATUS_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const { address, remind } = data;
      await accountManager.updateAccountRemindStatus(address, remind);
      await sleep(100);
      meta.resolve({});
    },
  );
};
