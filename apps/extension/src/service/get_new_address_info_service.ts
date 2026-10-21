import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { MnemonicAccount } from '../domain/account';
import { sleep } from '../lib/async_func';
import type { AddressItem, NewAddressItem } from '../domain/address_item';

interface Params {
  fromAddress?: string;
}

interface Result {
  mnemonicAccountCount: number;
  preAddressItem: AddressItem;
  newAddressItem: NewAddressItem;
}

const GET_NEW_ADDRESS_INFO_ACTION_NAME = 'GET_NEW_ADDRESS_INFO';

export const callGetNewAddressInfoService = async (
  msgNode: MessageNode,
  data: Params,
): Promise<Result> => {
  const res = await msgNode.send(new DuplexMessage(GET_NEW_ADDRESS_INFO_ACTION_NAME, data));
  return res;
};

export const registerGetNewAddressInfoService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_NEW_ADDRESS_INFO_ACTION_NAME);

  messageHub.on(
    GET_NEW_ADDRESS_INFO_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const mnemonicAccountCount = await accountManager.getMnemonicAccountCount();

      if (mnemonicAccountCount == 0) {
        meta.reject({
          message: 'NO MNEMONIC ACCOUNT FOUND',
        });
      }

      const { fromAddress } = data;

      let preAccount;
      let preAddressItem;

      if (fromAddress) {
        preAccount = (await accountManager.getMnemonicAccountByAddress(
          fromAddress,
        )) as MnemonicAccount;

        if (preAccount?.type != 'mnemonic') {
          meta.reject({
            message: 'NO MNEMONIC ACCOUNT FOUND',
          });
        }

        preAddressItem = accountManager.getAddressItem(fromAddress)!;
      } else {
        const { selectedAddressItem, selectedAccount } = await accountManager.getSelected();

        if (selectedAccount?.type == 'mnemonic') {
          preAccount = selectedAccount;
          preAddressItem = selectedAddressItem;
        } else {
          // we check we have at least one mnemonic account at the beginning
          preAccount = (await accountManager.getFirstMnemonicAccount())!;
          preAddressItem = accountManager.getFirstAddressItemOfAccount(preAccount)!;
        }
      }

      const newAddressItem = await accountManager.getNewAddressItemFromAccount(
        preAccount as MnemonicAccount,
        preAddressItem!.name,
      );
      await sleep(100);

      meta.resolve({
        mnemonicAccountCount,
        preAddressItem,
        newAddressItem,
      });
    },
  );
};
