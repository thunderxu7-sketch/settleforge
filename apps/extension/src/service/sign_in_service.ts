import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';

import { updateCheckAuthed } from '../store/slices/notification';
import { accountManager } from '../domain/account_manager';
import { getStore } from '../store/store';

interface AuthParams {
  password: string;
}

const SIGN_IN_ACTION_NAME = 'SIGN_IN';

export const callSignInService = async (msgNode: MessageNode, data: AuthParams) => {
  const res = await msgNode.send(new DuplexMessage(SIGN_IN_ACTION_NAME, data));
  return res;
};

export const registerSignInService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', SIGN_IN_ACTION_NAME);

  messageHub.on(SIGN_IN_ACTION_NAME, async (data: AuthParams, meta: DuplexMessageMetaType) => {
    const { password } = data;
    const valid = await accountManager.checkData(password);
    if (valid) {
      accountManager.setData(password);
      getStore().dispatch(updateCheckAuthed());
      meta.resolve({});

      // messageHub.broadcast('tab', new SimplexMessage('LOGIN_SUCCESS'));
      accountManager.notifyAddressChanged();

      return;
    }

    meta.reject({
      message: 'ERRORS.INVALID_PASSWORD',
    });
  });
};
