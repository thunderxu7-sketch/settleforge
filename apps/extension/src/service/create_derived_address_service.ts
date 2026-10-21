import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { accountManager } from '../domain/account_manager';
import { MnemonicAccount } from '../domain/account';
import { sleep } from '../lib/async_func';
import {
  storageAddressGenerateTypeManager,
  AddressGenerateType,
} from './utils/storageAddressGenerateTypeManager';

interface Params {
  fromAddress: string; // derive from which address
  name: string;
  address: string;
  accountIndex: number;
  addressIndex: number;
}

const CREATE_DERIVED_ADDRESS_ACTION_NAME = 'CREATE_DERIVED_ADDRESS';

export const callCreateDerivedAccountService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(CREATE_DERIVED_ADDRESS_ACTION_NAME, data));
  return res;
};

export const registerCreateDerivedAddressService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', CREATE_DERIVED_ADDRESS_ACTION_NAME);

  messageHub.on(
    CREATE_DERIVED_ADDRESS_ACTION_NAME,
    async (data: Params, meta: DuplexMessageMetaType) => {
      const { fromAddress, name, address, accountIndex, addressIndex } = data;

      try {
        const account = (await accountManager.getMnemonicAccountByAddress(
          fromAddress,
        )) as MnemonicAccount;

        const addressItem = await accountManager.createDerivedAddress(
          name,
          account,
          address,
          accountIndex,
          addressIndex,
        );

        accountManager.setSelectedAddress(addressItem.address);

        storageAddressGenerateTypeManager.setAddressGenerateType(
          address,
          AddressGenerateType.MNEMONIC_CREATE,
        );

        await sleep(100);

        meta.resolve(addressItem);
      } catch (e: any) {
        meta.reject({
          message: e.message,
        });
      }
    },
  );
};
