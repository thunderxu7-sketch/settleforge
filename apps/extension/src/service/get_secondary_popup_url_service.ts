import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import { secondaryPopup } from '../domain/secondary_popup';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';

const GET_SECONDARY_POPUP_URL_ACTION_NAME = 'GET_SECONDARY_POPUP_URL';

export const callGetSecondaryPopupUrlService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(GET_SECONDARY_POPUP_URL_ACTION_NAME));
  return res;
};

export const registerGetSecondaryPopupUrlService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_SECONDARY_POPUP_URL_ACTION_NAME);

  messageHub.on(
    GET_SECONDARY_POPUP_URL_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      const url = await secondaryPopup.getOpenedUrl();
      meta.resolve({
        url,
      });
    },
  );
};
