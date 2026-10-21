import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { IdKeyType } from '../domain/storege_sequence_ids';

interface Params {
  name: string;
  idKey: IdKeyType;
}

const GET_UNIQUE_NAME_ACTION_NAME = 'GET_UNIQUE_NAME';

export const callGetUniqueNameService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(GET_UNIQUE_NAME_ACTION_NAME, data));
  return res;
};

export const registerGetUniqueNameService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_UNIQUE_NAME_ACTION_NAME);

  messageHub.on(GET_UNIQUE_NAME_ACTION_NAME, async (data: Params, meta: DuplexMessageMetaType) => {
    const { name, idKey } = data;
    const uniqueName = await accountManager.getUniqueName(name, idKey);

    meta.resolve({
      name: uniqueName,
    });
  });
};
