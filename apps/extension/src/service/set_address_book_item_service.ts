import { MessageHub, MessageNode, SimplexMessage } from '../lib/bg_msg';
import { AddressBookItemType, setAddressBookItem } from '../store/slices/address_book';
import { getStore } from '../store/store';

const SET_ADDRESS_BOOK_ITEM_ACTION_NAME = 'SET_ADDRESS_BOOK_ITEM';

export const callSetAddressBookItemService = async (
  msgNode: MessageNode,
  data: AddressBookItemType,
) => {
  const res = await msgNode.send(new SimplexMessage(SET_ADDRESS_BOOK_ITEM_ACTION_NAME, data));
  return res;
};

export const registerSetAddressBookItemService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', SET_ADDRESS_BOOK_ITEM_ACTION_NAME);

  messageHub.on(SET_ADDRESS_BOOK_ITEM_ACTION_NAME, async (data: AddressBookItemType) => {
    getStore().dispatch(setAddressBookItem(data));
    return;
  });
};
