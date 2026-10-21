import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import _ from 'lodash';

interface AuthParams {
  password: string;
}

const BACKUP_ACTION_NAME = 'BACK_UP';

export const callBackUpService = async (msgNode: MessageNode, data: AuthParams) => {
  const res = await msgNode.send(new DuplexMessage(BACKUP_ACTION_NAME, data));
  return res;
};

export const registerBackUpService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', BACKUP_ACTION_NAME);

  messageHub.on(BACKUP_ACTION_NAME, async (data: AuthParams, meta: DuplexMessageMetaType) => {
    const { password } = data;
    const valid = await accountManager.checkData(password);
    if (valid) {
      const select = await accountManager.getSelected();
      const type = _.get(select, 'selectedAccount.type');
      let mnemonic = '';
      let privateKey = '';
      if (type === 'mnemonic') {
        mnemonic = _.get(select, 'selectedAccount.mnemonicPhase');
        const address = select.selectedAddressItem?.address;
        const detail = _.get(select, 'selectedAccount.addressDetails');
        privateKey = detail[address!].privateKey;
      } else if (type === 'private_key') {
        privateKey = _.get(select, 'selectedAccount.privateKey');
      }

      meta.resolve({
        mnemonic,
        privateKey,
      });

      return;
    }

    meta.reject({
      message: 'ERRORS.INVALID_PASSWORD',
    });
  });
};
