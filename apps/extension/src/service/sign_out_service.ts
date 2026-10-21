import { MessageHub, MessageNode, SimplexMessage } from '../lib/bg_msg';
import { updateCheckAuthed } from '../store/slices/notification';
import { accountManager } from '../domain/account_manager';
import { getStore } from '../store/store';
import { sendNotifyEvent } from '../lib/notify_event';

const SIGN_OUT_ACTION_NAME = 'SIGN_OUT';

export const callSignOutService = async (msgNode: MessageNode) => {
  await msgNode.send(new SimplexMessage(SIGN_OUT_ACTION_NAME));
};

export const registerSignOutService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', SIGN_OUT_ACTION_NAME);

  messageHub.on(SIGN_OUT_ACTION_NAME, async () => {
    accountManager.lock();
    getStore().dispatch(updateCheckAuthed());
    await sendNotifyEvent('changeAddress', { address: false, name: false, type: false });
  });
};
