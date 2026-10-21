import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';

import { accountManager } from '../domain/account_manager';

const ACCOUNTS_TYPE_ACTION_NAME = 'ACCOUNTS_TYPE';

export const callAccountsTypeService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(ACCOUNTS_TYPE_ACTION_NAME));
  return res;
};

export const registerAccountsTypeService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACCOUNTS_TYPE_ACTION_NAME);

  messageHub.on(ACCOUNTS_TYPE_ACTION_NAME, async (data, meta: DuplexMessageMetaType) => {
    const accountsType = await accountManager.getAccountsType();
    meta.resolve(accountsType);
  });
};
