import { v4 as uuidV4 } from 'uuid';
// @ts-ignore
import bip39 from 'bip39';
import * as bip32 from 'bip32';
// @ts-ignore
import TronWeb from 'tronweb';

import {
  LedgerAddressDetails,
  MnemonicAddressDetails,
  StorageAccounts,
  upsertStorageAccount,
} from './storage_account';
import { AddressItem, NewAddressItem } from './address_item';
import { MnemonicPhaseError } from './errors';

export type AccountType = 'private_key' | 'mnemonic' | 'ledger';

interface AddressContainer {
  containAddress: (address: string) => boolean;
}

abstract class Account {
  id: string;
  abstract type: AccountType;

  abstract generateAddressItem(name: string, options: any): Promise<AddressItem>;

  protected constructor() {
    this.id = uuidV4();
  }

  async persist(password: string) {
    // persist to storage
    const newAccountObj = await this.toStorageJSON();
    await upsertStorageAccount(password, newAccountObj);
  }

  protected abstract toStorageJSON(): Promise<StorageAccounts>;
}

export class PrivateKeyAccount extends Account implements AddressContainer {
  type: AccountType = 'private_key';
  privateKey: string;
  address: string;

  constructor(privateKey: string, address: string) {
    super();
    this.privateKey = privateKey;
    this.address = address;
  }

  async generateAddressItem(name: string): Promise<AddressItem> {
    // @ts-ignore
    const address = TronWeb.address.fromPrivateKey(this.privateKey);
    return new AddressItem(name, address);
  }

  protected async toStorageJSON() {
    return {
      [this.id]: {
        type: this.type,
        privateKey: this.privateKey,
        address: this.address,
      },
    } as StorageAccounts;
  }

  static fromStorageJSON({
    id,
    privateKey,
    address,
  }: {
    id: string;
    privateKey: string;
    address: string;
  }) {
    const inst = new PrivateKeyAccount(privateKey, address);
    inst.id = id;
    return inst;
  }

  containAddress(address: string): boolean {
    return this.address == address;
  }
}

export class MnemonicAccount extends Account implements AddressContainer {
  type: AccountType = 'mnemonic';
  mnemonicPhase: string;
  addressDetails: MnemonicAddressDetails;
  remind: boolean;

  constructor(mnemonicPhase: string) {
    super();
    this.mnemonicPhase = mnemonicPhase;
    this.addressDetails = {};
    this.remind = false;
  }

  validate() {
    if (this.mnemonicPhase.trim().split(/\s+/).join(' ') != this.mnemonicPhase) {
      throw new MnemonicPhaseError();
    }
    if (!bip39.validateMnemonic(this.mnemonicPhase)) {
      throw new MnemonicPhaseError();
    }
  }

  protected async toStorageJSON() {
    return {
      [this.id]: {
        type: this.type,
        mnemonicPhase: this.mnemonicPhase,
        addressDetails: this.addressDetails,
        remind: this.remind,
      },
    } as StorageAccounts;
  }

  static getPath(accountIndex = 0, addressIndex = 0) {
    return `m/44'/195'/${accountIndex}'/0/${addressIndex}`;
  }

  async generateAddressItem(
    name: string,
    accountIndex = 0,
    addressIndex = 0,
  ): Promise<AddressItem> {
    const { privateKey, address } = this.getPrivateAndAddress(accountIndex, addressIndex);
    this.addressDetails[address] = {
      privateKey,
      accountIndex,
      addressIndex,
    };
    return new AddressItem(name, address);
  }

  async generateNewAddressItem(
    name: string,
    accountIndex = 0,
    addressIndex = 0,
  ): Promise<AddressItem> {
    const { privateKey, address } = this.getPrivateAndAddress(accountIndex, addressIndex);
    this.addressDetails[address] = {
      privateKey,
      accountIndex,
      addressIndex,
    };
    return new NewAddressItem(name, address, addressIndex);
  }

  getPrivateAndAddress(accountIndex = 0, addressIndex = 0) {
    const path = MnemonicAccount.getPath(accountIndex, addressIndex);
    const seed = bip39.mnemonicToSeed(this.mnemonicPhase);
    // @ts-ignore
    const node = bip32.fromSeed(seed);
    const child = node.derivePath(path);
    // @ts-ignore
    const privateKey = child.privateKey.toString('hex');
    // @ts-ignore
    const address = TronWeb.address.fromPrivateKey(privateKey);
    return {
      privateKey,
      address,
    };
  }

  static fromStorageJSON({
    id,
    mnemonicPhase,
    addressDetails,
    remind,
  }: {
    id: string;
    mnemonicPhase: string;
    addressDetails: MnemonicAddressDetails;
    remind: boolean;
  }) {
    const inst = new MnemonicAccount(mnemonicPhase);
    inst.id = id;
    inst.addressDetails = addressDetails;
    inst.remind = remind;
    return inst;
  }

  findAddressDetail(address: string) {
    return this.addressDetails[address];
  }

  containAddress(address: string): boolean {
    return address in this.addressDetails;
  }

  async updateRemind(password: string, remind: boolean) {
    this.remind = remind;
    await this.persist(password);
  }
}

export class LedgerAccount implements AddressContainer {
  type: AccountType = 'ledger';
  id = 'ledger';
  addressDetails: LedgerAddressDetails;

  constructor() {
    this.addressDetails = {};
  }

  async generateAddressItem(
    name: string,
    address: string,
    accountIndex = 0,
    addressIndex = 0,
  ): Promise<AddressItem> {
    this.addressDetails[address] = {
      accountIndex,
      addressIndex,
    };
    return new AddressItem(name, address);
  }

  protected async toStorageJSON() {
    return {
      [this.id]: {
        type: this.type,
        addressDetails: this.addressDetails,
      },
    } as StorageAccounts;
  }

  static fromStorageJSON({ addressDetails }: { addressDetails: LedgerAddressDetails }) {
    const inst = new LedgerAccount();
    inst.addressDetails = addressDetails;
    return inst;
  }

  async persist(password: string) {
    // persist to storage
    const newAccountObj = await this.toStorageJSON();
    await upsertStorageAccount(password, newAccountObj);
  }

  containAddress(address: string): boolean {
    return address in this.addressDetails;
  }
}
