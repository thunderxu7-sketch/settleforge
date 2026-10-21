import _ from 'lodash';
// @ts-ignore
import bip39 from 'bip39';
// @ts-ignore
import { pbkdf2Sync as _pbkdf2Sync, pbkdf2 } from 'pbkdf2';
// @ts-ignore
import aesjs from 'aes-js';
// @ts-ignore
import * as scrypt from 'scrypt-js';
// @ts-ignore
import { utils } from 'ethers';
const { arrayify, concat, hexlify, toUtf8Bytes, UnicodeNormalizationForm, keccak256 } = utils;
// @ts-ignore
import TronWeb from 'tronweb';

export function getWordList(key = 'EN') {
  return bip39.wordlists[key];
}

export function validateMnemonic(mnemonic: string) {
  return bip39.validateMnemonic(mnemonic);
}

export function decryptString(password: string, salt: string, hexString: any) {
  const key = encryptKey(password, salt);
  const encryptedBytes = aesjs.utils.hex.toBytes(hexString);
  const aesCtr = new aesjs.ModeOfOperation.ctr(key);
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);
  return aesjs.utils.utf8.fromBytes(decryptedBytes);
}

const encryptKey = (password: string, salt: string) => {
  return pbkdf2.pbkdf2Sync(password, salt, 1, 256 / 8, 'sha512');
};

export function validatePrivateKey(privateKey: string) {
  try {
    const address = TronWeb.utils.crypto.pkToAddress(privateKey);
    return TronWeb.isAddress(address);
  } catch (e) {
    return false;
  }
}

export function isKeystoreWallet(json: string) {
  let data = null;
  try {
    data = JSON.parse(json);
  } catch (error) {
    return false;
  }
  return !(
    !data.version ||
    parseInt(data.version) !== data.version ||
    parseInt(data.version) !== 3
  );
}

function pbkdf2Sync(passwordBytes: any, salt: any, count: any, dkLen: any, prfFunc: any) {
  return arrayify(_pbkdf2Sync(passwordBytes, salt, count, dkLen, prfFunc));
}

function looseArrayify(hexString: string) {
  if (typeof hexString === 'string' && hexString.substring(0, 2) !== '0x') {
    hexString = '0x' + hexString;
  }
  return arrayify(hexString);
}

function _decrypt(data: any, key: any, ciphertext: any) {
  const cipher = _.get(data, 'crypto.cipher');
  if (cipher === 'aes-128-ctr') {
    const iv = looseArrayify(_.get(data, 'crypto.cipherparams.iv'));
    const counter = new aesjs.Counter(iv);
    const aesCtr = new aesjs.ModeOfOperation.ctr(key, counter);
    return arrayify(aesCtr.decrypt(ciphertext));
  }
  return null;
}

function _getAccount(data: any, key: any) {
  const ciphertext = looseArrayify(_.get(data, 'crypto.ciphertext'));

  const computedMAC = hexlify(keccak256(concat([key.slice(16, 32), ciphertext]))).substring(2);
  if (computedMAC !== _.get(data, 'crypto.mac').toLowerCase()) {
    throw new Error('invalid password');
  }

  const privateKey = _decrypt(data, key.slice(0, 16), ciphertext);
  if (!privateKey) {
    throw new Error(`unsupported cipher`);
  }

  // const mnemonicKey = key.slice(32, 64);
  const privateKeyStr = hexlify(privateKey).replace('0x', '');
  const address = TronWeb.address.fromPrivateKey(privateKeyStr);
  if (data.address) {
    const check = data.address.replace('0x', '');
    const checkAddress = TronWeb.address.fromHex(check);
    if (checkAddress !== address) {
      throw new Error('address mismatch');
    }
  }
  return {
    _isKeystoreAccount: true,
    address: address,
    privateKey: privateKeyStr,
  };
}

function getPassword(password: string) {
  if (typeof password === 'string') {
    return toUtf8Bytes(password, UnicodeNormalizationForm.NFKC);
  }
  return arrayify(password);
}

function _computeKdfKey(
  data: any,
  password: any,
  pbkdf2Func: any,
  scryptFunc: any,
  progressCallback?: any,
) {
  const passwordBytes = getPassword(password);

  const kdf = _.get(data, 'crypto.kdf');

  if (kdf && typeof kdf === 'string') {
    const throwError = function (name: any, value: any) {
      return new Error(`invalid key-derivation function parameters, ${name}, ${value}`);
    };

    if (kdf.toLowerCase() === 'scrypt') {
      const salt = looseArrayify(_.get(data, 'crypto.kdfparams.salt'));
      const N = parseInt(_.get(data, 'crypto.kdfparams.n'));
      const r = parseInt(_.get(data, 'crypto.kdfparams.r'));
      const p = parseInt(_.get(data, 'crypto.kdfparams.p'));

      // Check for all required parameters
      if (!N || !r || !p) {
        throwError('kdf', kdf);
      }

      // Make sure N is a power of 2
      if ((N & (N - 1)) !== 0) {
        throwError('N', N);
      }

      const dkLen = parseInt(_.get(data, 'crypto.kdfparams.dklen'));
      if (dkLen !== 32) {
        throwError('dklen', dkLen);
      }
      return scryptFunc(passwordBytes, salt, N, r, p, 64, progressCallback);
    } else if (kdf.toLowerCase() === 'pbkdf2') {
      const salt = looseArrayify(_.get(data, 'crypto.kdfparams.salt'));

      let prfFunc = null;
      const prf = _.get(data, 'crypto.kdfparams.prf');
      if (prf === 'hmac-sha256') {
        prfFunc = 'sha256';
      } else if (prf === 'hmac-sha512') {
        prfFunc = 'sha512';
      } else {
        throwError('prf', prf);
      }

      const count = parseInt(_.get(data, 'crypto.kdfparams.c'));

      const dkLen = parseInt(_.get(data, 'crypto.kdfparams.dklen'));
      if (dkLen !== 32) {
        throwError('dklen', dkLen);
      }

      return pbkdf2Func(passwordBytes, salt, count, dkLen, prfFunc);
    }
  }

  return new Error(`unsupported key-derivation function, kdf, ${kdf}`);
}

export function decryptSync(json: any, password: any, nonStrict = false) {
  const data = JSON.parse(nonStrict ? json.toLowerCase() : json);
  const key = _computeKdfKey(data, password, pbkdf2Sync, scrypt.syncScrypt);
  return _getAccount(data, key);
}

export function readFileContentsFromEvent(ev: any) {
  return new Promise((resolve) => {
    const files = ev.target.files;
    const reader = new FileReader();
    reader.onload = (file: any) => {
      const contents = file.target.result;
      resolve(contents);
    };

    reader.readAsText(files[0]);
  });
}

/**
 * Converts a byte array to string
 *
 * @param {Uint8Array} arr byte array
 * @returns {string}
 */
export function bytesToString(arr: any) {
  if (typeof arr === 'string') {
    return arr;
  }
  let str = '';
  const _arr = arr;
  for (let i = 0; i < _arr.length; i++) {
    const one = _arr[i].toString(2),
      v = one.match(/^1+?(?=0)/);
    if (v && one.length === 8) {
      const bytesLength = v[0].length;
      let store = _arr[i].toString(2).slice(7 - bytesLength);
      for (let st = 1; st < bytesLength; st++) {
        store += _arr[st + i].toString(2).slice(2);
      }
      str += String.fromCharCode(parseInt(store, 2));
      i += bytesLength - 1;
    } else {
      str += String.fromCharCode(_arr[i]);
    }
  }
  return str;
}

/* Check if a char is hex char */
export function isHexChar(c: string) {
  if ((c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f') || (c >= '0' && c <= '9')) {
    return 1;
  }
  return 0;
}

/* Convert a hex char to value */
export function hexChar2byte(c: string) {
  let d = 0;
  if (c >= 'A' && c <= 'F') {
    d = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  } else if (c >= 'a' && c <= 'f') {
    d = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
  } else if (c >= '0' && c <= '9') {
    d = c.charCodeAt(0) - '0'.charCodeAt(0);
  }
  return d;
}

/* Convert HEX string to byte array */
export function hexStr2byteArray(str: string) {
  const byteArray: any = [];
  let d = 0;
  let j = 0;
  let k = 0;

  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    if (isHexChar(c)) {
      d <<= 4;
      d += hexChar2byte(c);
      j++;
      if (0 === j % 2) {
        byteArray[k++] = d;
        d = 0;
      }
    }
  }
  return byteArray;
}

export function isTronscanKeystore(json: any) {
  let data = null;
  try {
    data = JSON.parse(json);
  } catch (error) {
    return false;
  }
  return !(
    !data.version ||
    parseInt(data.version) !== data.version ||
    parseInt(data.version) !== 1
  );
}
