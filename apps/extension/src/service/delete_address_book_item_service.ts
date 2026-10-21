import { MessageHub, MessageNode, SimplexMessage } from '../lib/bg_msg';

import { deleteAddressBookItem } from '../store/slices/address_book';
import { getStore } from '../store/store';

const DELETE_ADDRESS_BOOK_ITEM_ACTION_NAME = 'DELETE_ADDRESS_BOOK_ITEM';

export const callDeleteAddressBookItemService = async (msgNode: MessageNode, data: string) => {
  const res = await msgNode.send(new SimplexMessage(DELETE_ADDRESS_BOOK_ITEM_ACTION_NAME, data));
  return res;
};

export const registerDeleteAddressBookItemService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', DELETE_ADDRESS_BOOK_ITEM_ACTION_NAME);

  messageHub.on(DELETE_ADDRESS_BOOK_ITEM_ACTION_NAME, async (data: string) => {
    getStore().dispatch(deleteAddressBookItem(data));
    return;
  });
};
