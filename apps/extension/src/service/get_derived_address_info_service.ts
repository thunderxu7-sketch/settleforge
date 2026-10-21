import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { MnemonicAccount } from '../domain/account';

interface Params {
  fromAddress: string;
  accountIndex: number;
  addressIndex: number;
}

const GET_DERIVED_ADDRESS_INFO_ACTION_NAME = 'GET_DERIVED_ADDRESS_INFO';

export const callGetDerivedAddressInfoService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(GET_DERIVED_ADDRESS_INFO_ACTION_NAME, data));
  return res;
};

export const registerGetDerivedAddressInfoService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_DERIVED_ADDRESS_INFO_ACTION_NAME);

  messageHub.on(
    GET_DERIVED_ADDRESS_INFO_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const { fromAddress, accountIndex, addressIndex } = data;

      const account = (await accountManager.getMnemonicAccountByAddress(
        fromAddress,
      )) as MnemonicAccount;

      if (account?.type != 'mnemonic') {
        meta.reject({
          message: 'NO MNEMONIC ACCOUNT FOUND',
        });
      }

      const info = await accountManager.getDerivedAddressInfo(account, accountIndex, addressIndex);

      meta.resolve(info);
    },
  );
};
