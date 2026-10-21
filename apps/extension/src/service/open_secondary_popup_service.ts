import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import { secondaryPopup } from '../domain/secondary_popup';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';

interface Params {
  path: string;
  close?: boolean;
}

const OPEN_SECONDARY_POPUP_ACTION_NAME = 'OPEN_SECONDARY_POPUP';

export const callOpenSecondaryPopupService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(OPEN_SECONDARY_POPUP_ACTION_NAME, data));
  return res;
};

export const registerOpenSecondaryPopupService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', OPEN_SECONDARY_POPUP_ACTION_NAME);

  messageHub.on(
    OPEN_SECONDARY_POPUP_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const { path, close } = data;
      if (close) {
        await secondaryPopup.close();
      }
      await secondaryPopup.open(path);
      meta.resolve({});
    },
  );
};
