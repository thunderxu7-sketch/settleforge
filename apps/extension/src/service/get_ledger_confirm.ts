import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { redirectPopupToPage } from '../lib/popup';

const GET_LEDGER_CONFIRM_ACTION_NAME = 'GET_LEDGER_CONFIRM';

interface Params {
  redirectPage: string;
}

export const callLedgerConfirmService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(GET_LEDGER_CONFIRM_ACTION_NAME, data));
  return res;
};

export const registerLedgerConfirmService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_LEDGER_CONFIRM_ACTION_NAME);

  messageHub.on(
    GET_LEDGER_CONFIRM_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const { redirectPage } = data;
      await redirectPopupToPage(redirectPage);

      meta.resolve({});
    },
  );
};
