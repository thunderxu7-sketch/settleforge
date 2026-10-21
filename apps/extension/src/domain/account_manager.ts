import _ from 'lodash';
import { createHash } from 'crypto';
// @ts-ignore
import TronWeb from 'tronweb';

import {
  deleteAddressItem,
  updateAddressItem,
  updateSelectedAddress,
} from '../store/slices/address_info';
import { deleteAccount, getStorageAccounts, StorageAccountType } from './storage_account';
import { AddressItem } from './address_item';
import { LedgerAccount, MnemonicAccount, PrivateKeyAccount } from './account';
import {
  AddressExistError,
  AddressInvalidError,
  DataError,
  NameExistError,
  OnlyOneAddressLeftError,
} from './errors';
import type { IdKeyType } from './storege_sequence_ids';
import { getStorageSequenceId, increaseStorageSequenceId } from './storege_sequence_ids';
import type { RootState } from '../store/store';
import { getStore } from '../store/store';
import { EVENT_CHANGE_ADDRESS, EVENT_DELETE_ADDRESS, eventBus } from './event_bus';
import { sendNotifyEvent } from '../lib/notify_event';
import { sleep } from '../lib/async_func';
import { encrypt } from '../lib/keystore';

class AccountsManager {
  #trlk?: string;

  static #instance: AccountsManager;

  private constructor() {
    this.registerEvents();
  }

  public static getInstance(): AccountsManager {
    if (!AccountsManager.#instance) {
      AccountsManager.#instance = new AccountsManager();
    }

    return AccountsManager.#instance;
  }

  setData(data: string) {
    const hash = createHash('sha256')
      .update(data + '<trlk>')
      .digest('hex');
    this.#trlk = hash;
  }

  lock() {
    this.#trlk = undefined;
  }

  isLocked() {
    return this.#trlk == undefined;
  }

  async importPrivateKeyAccount(name: string, privateKey: string, address: string, isOld: boolean) {
    /**
     * may throw DataError, AddressExistError
     */
    this.checkNameBlank(name);
    this.checkDataSet();

    if (isOld) {
      name = `${name}-old`;
      name = this.extendName(name);
    } else {
      this.checkNameExist(name);
    }

    const account = new PrivateKeyAccount(privateKey, address);
    const addressItem = await account.generateAddressItem(name);

    if (addressItem.address != account.address) {
      throw new Error('invalid address');
    }

    this.checkAddressExist(addressItem.address);

    await account.persist(this.#trlk!);

    getStore().dispatch(updateAddressItem(addressItem));
  }

  async importMnemonicAccount(
    name: string,
    mnemonicPhase: string,
    address: string,
    accountIndex = 0,
    addressIndex = 0,
  ) {
    /**
     * may throw DataError, AddressExistError
     */
    this.checkNameBlank(name);
    this.checkDataSet();

    if (addressIndex > 0) {
      name = `${name} #${addressIndex}`;
    }

    name = this.extendName(name);

    let account = await this.getMnemonicAccountByPhase(mnemonicPhase);
    if (!account) {
      account = new MnemonicAccount(mnemonicPhase);
      account.validate();
    }
    const addressItem = await account.generateAddressItem(name, accountIndex, addressIndex);

    if (addressItem.address != address) {
      throw new Error('invalid address');
    }

    this.checkAddressExist(addressItem.address);

    // persist to storage
    await account.persist(this.#trlk!);

    getStore().dispatch(updateAddressItem(addressItem));
    await sleep(100);
  }

  async importLedgerAccount(
    name: string,
    address: string,
    accountIndex: number,
    addressIndex: number,
  ) {
    /**
     * may throw DataError, AddressExistError
     */
    this.checkNameBlank(name);
    this.checkDataSet();

    name = this.extendName(name);

    if (!TronWeb.isAddress(address)) {
      throw new AddressInvalidError();
    }

    if (
      !_.isNumber(accountIndex) ||
      !_.isNumber(addressIndex) ||
      accountIndex < 0 ||
      addressIndex < 0
    ) {
      throw new AddressInvalidError();
    }

    let account = await this.getLedgerAccount();
    if (!account) {
      account = new LedgerAccount();
    }
    const addressItem = await account.generateAddressItem(
      name,
      address,
      accountIndex,
      addressIndex,
    );

    this.checkAddressExist(addressItem.address);

    await account.persist(this.#trlk!);

    getStore().dispatch(updateAddressItem(addressItem));
  }

  async createDerivedAddress(
    name: string,
    account: MnemonicAccount,
    address: string,
    accountIndex: number,
    addressIndex: number,
  ) {
    this.checkDataSet();

    const newName = this.extendName(name);
    const addressItem = await account.generateAddressItem(newName, accountIndex, addressIndex);

    if (addressItem.address != address) {
      throw new Error('invalid address');
    }

    this.checkAddressExist(addressItem.address);

    await account.persist(this.#trlk!);
    getStore().dispatch(updateAddressItem(addressItem));

    return addressItem;
  }

  private async getMnemonicAccountByPhase(
    mnemonicPhase: string,
  ): Promise<MnemonicAccount | undefined> {
    const storageAccounts = await getStorageAccounts(this.#trlk!);
    let account;
    for (const [id, storageAccount] of Object.entries(storageAccounts)) {
      if (storageAccount.type == 'mnemonic') {
        const tmpAccount = (await this.getAccountInstance(id, storageAccount)) as MnemonicAccount;
        if (tmpAccount?.mnemonicPhase == mnemonicPhase) {
          account = tmpAccount;
        }
      }
    }
    return account;
  }

  async getMnemonicAccountByAddress(address: string): Promise<MnemonicAccount | undefined> {
    const storageAccounts = await getStorageAccounts(this.#trlk!);
    let account;
    for (const [id, storageAccount] of Object.entries(storageAccounts)) {
      if (storageAccount.type == 'mnemonic') {
        const tmpAccount = (await this.getAccountInstance(id, storageAccount)) as MnemonicAccount;
        if (tmpAccount?.findAddressDetail(address)) {
          account = tmpAccount;
        }
      }
    }
    return account;
  }

  async getLedgerAccount(): Promise<LedgerAccount | undefined> {
    const storageAccounts = await getStorageAccounts(this.#trlk!);
    let account;
    const storageAccount = storageAccounts['ledger'];
    if (storageAccount) {
      account = (await this.getAccountInstance('ledger', storageAccount)) as LedgerAccount;
    }
    return account;
  }

  async checkData(data: string) {
    try {
      const hash = createHash('sha256')
        .update(data + '<trlk>')
        .digest('hex');
      const storageAccounts = await getStorageAccounts(hash);
      return _.size(storageAccounts) != 0;
    } catch (e) {
      return false;
    }
  }

  private async getAccountInstance(
    id: string,
    storageAccount: StorageAccountType,
  ): Promise<PrivateKeyAccount | MnemonicAccount | LedgerAccount | undefined> {
    if (storageAccount.type == 'private_key') {
      return PrivateKeyAccount.fromStorageJSON({
        id,
        privateKey: storageAccount.privateKey,
        address: storageAccount.address,
      });
    } else if (storageAccount.type == 'mnemonic') {
      return MnemonicAccount.fromStorageJSON({
        id,
        mnemonicPhase: storageAccount.mnemonicPhase,
        addressDetails: storageAccount.addressDetails,
        remind: storageAccount.remind,
      });
    } else if (storageAccount.type == 'ledger') {
      return LedgerAccount.fromStorageJSON({ addressDetails: storageAccount.addressDetails });
    }
    return undefined;
  }

  setSelectedAddress(address: string) {
    getStore().dispatch(updateSelectedAddress(address));

    eventBus.emit(EVENT_CHANGE_ADDRESS);
  }

  private getSelectedAddressItem(): AddressItem | undefined {
    const rootState: RootState = getStore().getState();
    const selectedAddress = rootState.addressInfo.selectedAddress;
    return rootState.addressInfo.addressItems[selectedAddress];
  }

  getSelectedAddress() {
    const rootState: RootState = getStore().getState();
    return rootState.addressInfo.selectedAddress;
  }

  async getSelected() {
    this.checkDataSet();

    const selectedAddressItem = this.getSelectedAddressItem();
    let selectedAccount;

    const storageAccounts = await getStorageAccounts(this.#trlk!);
    for (const [id, storageAccount] of Object.entries(storageAccounts)) {
      const account = await this.getAccountInstance(id, storageAccount);
      if (selectedAddressItem?.address && account?.containAddress(selectedAddressItem.address)) {
        selectedAccount = account;
      }
    }

    return {
      selectedAddressItem,
      selectedAccount,
    };
  }

  async getMnemonicAccountCount() {
    this.checkDataSet();

    const storageAccounts = await getStorageAccounts(this.#trlk!);
    let count = 0;
    for (const storageAccount of Object.values(storageAccounts)) {
      if (storageAccount.type == 'mnemonic') {
        count++;
      }
    }
    return count;
  }

  async getMnemonicAccounts() {
    // TODO: security reason, hide mnemonic
    this.checkDataSet();

    const storageAccounts = await getStorageAccounts(this.#trlk!);
    const array = [];
    for (const storageAccount of Object.values(storageAccounts)) {
      if (storageAccount.type == 'mnemonic') {
        array.push(storageAccount);
      }
    }
    return array;
  }

  async getFirstMnemonicAccount(): Promise<MnemonicAccount | undefined> {
    this.checkDataSet();

    const storageAccounts = await getStorageAccounts(this.#trlk!);
    for (const [id, storageAccount] of Object.entries(storageAccounts)) {
      if (storageAccount.type == 'mnemonic') {
        const tmpAccount = (await this.getAccountInstance(id, storageAccount)) as MnemonicAccount;
        return tmpAccount;
      }
    }
    return undefined;
  }

  getFirstAddressItemOfAccount(account: MnemonicAccount): AddressItem | undefined {
    const address = _.keys(account.addressDetails)[0];
    const rootState: RootState = getStore().getState();
    return rootState.addressInfo.addressItems[address];
  }

  async getNewAddressItemFromAccount(account: MnemonicAccount, name: string): Promise<AddressItem> {
    this.checkDataSet();

    let stop = false;
    let index = 0;

    let newAddressItem: AddressItem;
    while (!stop) {
      let newName = name;

      if (/#.*?$/.test(newName)) {
        newName = newName.replace(/#.*?$/, `#${index}`);
      } else {
        newName = `${newName} #${index}`;
      }

      newName = this.extendName(newName);

      newAddressItem = await account.generateNewAddressItem(newName, 0, index);

      try {
        this.checkAddressExist(newAddressItem.address);
      } catch (e) {
        index++;
        continue;
      }

      stop = true;
    }

    return newAddressItem!;
  }

  async getDerivedAddressInfo(
    account: MnemonicAccount,
    accountIndex: number,
    addressIndex: number,
  ): Promise<{ address: string; isExisted: boolean }> {
    this.checkDataSet();

    const { address } = account.getPrivateAndAddress(accountIndex, addressIndex);

    let isExisted = false;
    try {
      this.checkAddressExist(address);
    } catch (e) {
      isExisted = true;
    }

    return {
      address,
      isExisted,
    };
  }

  async getUniqueName(name: string, idKey: IdKeyType): Promise<string> {
    let index = await getStorageSequenceId(idKey);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let fullName = name;
      if (index != 0) {
        fullName = `${name}-${index}`;
      }
      try {
        this.checkNameExist(fullName);
        return fullName;
      } catch (e) {
        index = await increaseStorageSequenceId(idKey);
      }
    }
  }

  async updateName(address: string, newName: string) {
    this.checkDataSet();
    this.checkNameExist(newName);
    const addressItem = _.cloneDeep(this.getAddressItem(address));
    addressItem.name = newName;
    getStore().dispatch(updateAddressItem(addressItem));
  }

  async deleteAddress() {
    this.checkDataSet();

    const addressItemList = Object.values(this.getAddressItems());
    const allAddressCount = addressItemList.length;

    if (allAddressCount == 1) {
      throw new OnlyOneAddressLeftError();
    }

    const { selectedAccount, selectedAddressItem } = await this.getSelected();

    const address = selectedAddressItem!.address;

    const nextAddressItem = _.find(addressItemList, (ele) => ele.address != address);

    getStore().dispatch(
      deleteAddressItem({
        selectedAddress: nextAddressItem!.address,
        deletedAddress: address,
      }),
    );

    if (selectedAccount instanceof MnemonicAccount || selectedAccount instanceof LedgerAccount) {
      if (_.size(selectedAccount.addressDetails) > 1) {
        delete selectedAccount.addressDetails[address];
        await selectedAccount.persist(this.#trlk!);
      } else {
        await deleteAccount(this.#trlk!, selectedAccount!.id);
      }
    } else {
      await deleteAccount(this.#trlk!, selectedAccount!.id);
    }

    eventBus.emit(EVENT_CHANGE_ADDRESS);
    eventBus.emit(EVENT_DELETE_ADDRESS, { address });
  }

  async getAccountRemindStatus(address: string): Promise<boolean> {
    this.checkDataSet();

    const account = await this.getMnemonicAccountByAddress(address);
    return account?.remind || false;
  }

  async updateAccountRemindStatus(address: string, remind: boolean) {
    this.checkDataSet();

    const account = await this.getMnemonicAccountByAddress(address);
    await account?.updateRemind(this.#trlk!, remind);
  }

  private extendName(name: string) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        this.checkNameExist(name);
        break;
      } catch (e) {
        // ignore
        name = `${name}(1)`;
      }
    }
    return name;
  }

  private checkNameBlank(name: string) {
    if (!name || name.trim() == '') {
      // should not throw in production
      throw new Error('invalid name');
    }
  }

  private checkDataSet() {
    if (!this.#trlk) {
      throw new DataError();
    }
  }

  private checkNameExist(name: string) {
    const addressItems = this.getAddressItems();
    if (_.size(addressItems) == 0) {
      return;
    }
    for (const addressItem of Object.values(addressItems)) {
      if (addressItem.name == name) {
        throw new NameExistError();
      }
    }
  }

  private checkAddressExist(address: string) {
    const addressItems = this.getAddressItems();
    if (_.size(addressItems) == 0) {
      return;
    }
    for (const addressItem of Object.values(addressItems)) {
      if (addressItem.address == address) {
        throw new AddressExistError();
      }
    }
  }

  private getAddressItems() {
    const rootState: RootState = getStore().getState();
    return rootState.addressInfo.addressItems;
  }

  public getAddressItem(address: string) {
    const addressItems = this.getAddressItems();
    return addressItems[address];
  }

  getAccountType(account: PrivateKeyAccount | MnemonicAccount | LedgerAccount | any) {
    if (account instanceof MnemonicAccount) {
      return 0;
    } else if (account instanceof PrivateKeyAccount) {
      return 1;
    } else if (account instanceof LedgerAccount) {
      return 2;
    } else {
      return -1;
    }
  }

  async getAccountsType() {
    this.checkDataSet();
    const accountsType: { [address: string]: number } = {};
    const storageAccounts = await getStorageAccounts(this.#trlk!);
    for (const [id, storageAccount] of Object.entries(storageAccounts)) {
      const account = await this.getAccountInstance(id, storageAccount);
      if (account) {
        if (account instanceof MnemonicAccount) {
          const addressDetails = account.addressDetails;
          Object.keys(addressDetails).forEach((address) => {
            accountsType[address] = 0;
          });
        }
        if (account instanceof PrivateKeyAccount) {
          const address: string = account!.address;

          accountsType[address] = 1;
        }
        if (account instanceof LedgerAccount) {
          const addressDetails = account.addressDetails;
          Object.keys(addressDetails).forEach((address) => {
            accountsType[address] = 2;
          });
        }
      }
    }

    return accountsType;
  }

  async getPrivateKey(address: false | string = false) {
    this.checkDataSet();
    if (!address) {
      address = await this.getSelectedAddress();
    }
    const storageAccounts = await getStorageAccounts(this.#trlk!);
    for (const [id, storageAccount] of Object.entries(storageAccounts)) {
      const account = await this.getAccountInstance(id, storageAccount);
      if (account) {
        if (account instanceof MnemonicAccount) {
          const addressDetails = account.addressDetails;
          if (addressDetails[address]) {
            return addressDetails[address]!.privateKey;
          }
        }
        if (account instanceof PrivateKeyAccount) {
          const addressIn: string = account!.address;
          if (addressIn === address) {
            return account!.privateKey;
          }
        }
      }
    }
    return false;
  }

  async getKeyStore(data: string) {
    this.checkDataSet();
    const { selectedAccount, selectedAddressItem } = await this.getSelected();
    const address = selectedAddressItem?.address;
    let mnemonic = '';
    let privateKey: string | boolean = '';
    if (selectedAccount instanceof MnemonicAccount) {
      mnemonic = selectedAccount.mnemonicPhase;
      privateKey = await this.getPrivateKey();
    } else if (selectedAccount instanceof PrivateKeyAccount) {
      privateKey = selectedAccount.privateKey;
    }
    const account = {
      mnemonic,
      privateKey,
      address,
    };
    return await encrypt(account, data, '', '');
  }

  private registerEvents() {
    eventBus.on(EVENT_CHANGE_ADDRESS, async () => {
      await sleep(100);
      const { selectedAddressItem, selectedAccount } = await this.getSelected();
      if (selectedAddressItem) {
        const data = {
          address: selectedAddressItem.address,
          name: selectedAddressItem.name,
          type: this.getAccountType(selectedAccount),
        };
        await sendNotifyEvent('changeAddress', data);
      }
    });
  }

  public notifyAddressChanged() {
    eventBus.emit(EVENT_CHANGE_ADDRESS);
  }
}

export const accountManager = AccountsManager.getInstance();
