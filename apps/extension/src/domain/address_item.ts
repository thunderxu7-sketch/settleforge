import { AddressItemType } from '../store/slices/address_info';

export class AddressItem implements AddressItemType {
  name: string;
  address: string;

  activeTime: number;
  createdTime: number;

  constructor(name: string, address: string) {
    this.name = name;
    this.address = address;

    this.activeTime = 0;
    this.createdTime = Date.now();
  }
}

export class NewAddressItem extends AddressItem implements AddressItemType {
  accountIndex: number;
  addressIndex: number;

  constructor(name: string, address: string, addressIndex: number) {
    super(name, address);
    this.accountIndex = 0;
    this.addressIndex = addressIndex;
  }
}
