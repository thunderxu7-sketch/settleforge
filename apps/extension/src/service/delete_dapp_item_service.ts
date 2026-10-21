import { MessageHub, MessageNode, SimplexMessage } from '../lib/bg_msg';
import { deleteDAppItem } from '../store/slices/dapp_list';
import { getStore } from '../store/store';

const DELETE_DAPP_ITEM_ACTION_NAME = 'DELETE_DAPP_ITEM';

export const callDeleteDAppItemService = async (msgNode: MessageNode, data: string) => {
  const res = await msgNode.send(new SimplexMessage(DELETE_DAPP_ITEM_ACTION_NAME, data));
  return res;
};

export const registerDeleteDAppItemService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', DELETE_DAPP_ITEM_ACTION_NAME);
  messageHub.on(DELETE_DAPP_ITEM_ACTION_NAME, async (data: string) => {
    getStore().dispatch(deleteDAppItem(data));
  });
};
