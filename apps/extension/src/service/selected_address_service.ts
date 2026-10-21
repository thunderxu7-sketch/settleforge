import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import { getStore } from '../store/store';

import { updateSelectedAddress } from '../store/slices/address_info';
import { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { sendNotifyEvent } from '../lib/notify_event';
import { accountManager } from '../domain/account_manager';
import { sleep } from '../lib/async_func';

type Params = {
  address: string;
};

const SELECTED_ADDRESS_ACTION_NAME = 'SELECTED_ADDRESS';

export const callSetSelectedAddressService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(SELECTED_ADDRESS_ACTION_NAME, data));
  return res;
};

export const registerSetSelectedAddressService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', SELECTED_ADDRESS_ACTION_NAME);

  messageHub.on(SELECTED_ADDRESS_ACTION_NAME, async (data: Params, meta: DuplexMessageMetaType) => {
    accountManager.setSelectedAddress(data.address);

    meta.resolve({});
  });
};
