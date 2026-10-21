import { v4 as uuidV4 } from 'uuid';

import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { sleep } from '../lib/async_func';
import { getStore, RootState } from '../store/store';
import { updateDeviceID, selectLanguage, updateLanguage } from '../store/slices/settings';
import { useAppSelector } from '../store/hooks';
import {
  ACCOUNT_INFO,
  IMPORT_WALLET_STRING,
  KEYRING,
  LATEST_LOCATION,
  RESOURCE_INFO,
  SEARCH_HISTORY,
  SECONDARY_POPUP_LATEST_LOCATION,
  SEQUENCE_IDS,
} from '../constants/storage_keys';

const RESET_APP_ACTION_NAME = 'RESET_APP';

export const callResetAppService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(RESET_APP_ACTION_NAME));
  return res;
};

export const registerResetAppService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', RESET_APP_ACTION_NAME);

  messageHub.on(RESET_APP_ACTION_NAME, async (data: undefined, meta: DuplexMessageMetaType) => {
    const rootState: RootState = getStore().getState();
    const language = rootState.settings.language;
    getStore().dispatch({ type: 'RESET_APP' });
    await sleep(100);
    // chrome.storage.local.clear(function () {
    //   const error = chrome.runtime.lastError;
    //   if (error) {
    //     console.error(error);
    //   }
    //   meta.resolve({});
    // });
    chrome.storage.local.remove(
      [
        LATEST_LOCATION,
        SECONDARY_POPUP_LATEST_LOCATION,
        KEYRING,
        SEQUENCE_IDS,
        RESOURCE_INFO,
        ACCOUNT_INFO,
        SEARCH_HISTORY,
        IMPORT_WALLET_STRING,
      ],
      async function () {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error(error);
        }

        const newDeviceID = uuidV4();
        getStore().dispatch(updateDeviceID(newDeviceID));
        getStore().dispatch(updateLanguage(language));
        await sleep(100);

        meta.resolve({});
      },
    );
  });
};
