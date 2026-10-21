import log from 'loglevel';
import { MessageHub, MessageNode, DuplexMessage } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { updateDAppList } from '../store/slices/dapp_list';
import { getStore } from '../store/store';
import { getRecommendList } from '../service/local_data_service';

const GET_DAPP_LIST_ACTION_NAME = 'GET_DAPP_LIST';

export const callGetDAppListService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(GET_DAPP_LIST_ACTION_NAME));
  return res;
};

export const registerGetDAppListService = (messageHub: MessageHub) => {
  try {
    messageHub.registerSourceActionName('popup', GET_DAPP_LIST_ACTION_NAME);

    messageHub.on(
      GET_DAPP_LIST_ACTION_NAME,
      async (params: undefined, meta: DuplexMessageMetaType) => {
        const store = getStore();
        const state = store.getState();
        const selectedAddress = state.addressInfo.selectedAddress;

        const { success, data } = await getRecommendList(selectedAddress);
        const list = {
          recommend: data,
          used: state.dappList.used,
        };

        store.dispatch(updateDAppList(list));

        meta.resolve({ success });
      },
    );
  } catch (error) {
    log.error('registerGetDAppListService error: ', error);
  }
};
