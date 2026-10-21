import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { sleep } from '../lib/async_func';

const DELETE_ADDRESS_ACTION_NAME = 'DELETE_ADDRESS';

export const callDeleteAddressService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(DELETE_ADDRESS_ACTION_NAME));
  return res;
};

export const registerDeleteAddressService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', DELETE_ADDRESS_ACTION_NAME);

  messageHub.on(
    DELETE_ADDRESS_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      try {
        await accountManager.deleteAddress();

        await sleep(100);

        meta.resolve({});
      } catch (e: any) {
        meta.reject({
          message: e.message,
        });
      }
    },
  );
};
