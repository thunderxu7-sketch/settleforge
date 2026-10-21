// @ts-ignore
import bip39 from 'bip39';
import * as bip32 from 'bip32';
// @ts-ignore
import TronWeb from 'tronweb';

export function createDefinePath(accountIndex: number, addressIndex: number) {
  return `m/44'/195'/${accountIndex}'/0/${addressIndex}`;
}

export function getAccountByDefinePath(mnemonic: string, path: string) {
  const seed = bip39.mnemonicToSeed(mnemonic);
  const node = bip32.fromSeed(seed);
  const child = node.derivePath(path);
  const privateKey = child?.privateKey?.toString('hex');
  const address: string = TronWeb.address.fromPrivateKey(privateKey);

  return {
    address,
  };
}

export function getAccountBySeq(mnemonic: string, index = 0) {
  const seed = bip39.mnemonicToSeed(mnemonic);
  const node = bip32.fromSeed(seed);
  const child = node.derivePath(`m/44'/195'/0'/0/${index}`);
  const privateKey = child?.privateKey?.toString('hex');
  const address = TronWeb.address.fromPrivateKey(privateKey);

  return {
    address,
  };
}

export function getAccountAtIndex(mnemonic: string, index = 0) {
  const seed = bip39.mnemonicToSeed(mnemonic);
  const node = bip32.fromSeed(seed);
  const child = node.derivePath(`m/44'/195'/${index}'/0/0`);
  const privateKey = child?.privateKey?.toString('hex');
  const address = TronWeb.address.fromPrivateKey(privateKey);

  return {
    address,
  };
}

export const checkIndex = (value: number) => {
  let index = isNaN(Number(value)) ? 0 : Number(value);
  if (index && !/[0-9]/g.test(String(index))) {
    return false;
  }
  if (index > 999999) {
    index = 999999;
  }
  return index;
};
