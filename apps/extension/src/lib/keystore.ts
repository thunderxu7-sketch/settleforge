// @ts-ignore
import TronWeb from 'tronweb';
import { utils } from 'ethers';
// @ts-ignore
import aes from 'aes-js';
import * as scrypt from 'scrypt-js';
// @ts-ignore
import { v4 as uuidV4 } from 'uuid';
const { arrayify, concat, hexlify, toUtf8Bytes, UnicodeNormalizationForm, keccak256, randomBytes } =
  utils;

export function getPassword(password: any) {
  if (typeof password === 'string') {
    return toUtf8Bytes(password, UnicodeNormalizationForm.NFKC);
  }
  return arrayify(password);
}

export function encrypt(account: any, password: any, options: any = {}, progressCallback: any) {
  try {
    // Check the address matches the private key
    if (account.address !== TronWeb.address.fromPrivateKey(account.privateKey)) {
      throw new Error('address/privateKey mismatch');
    }
  } catch (e) {
    return Promise.reject(e);
  }

  // The options are optional, so adjust the call as needed
  if (typeof options === 'function' && !progressCallback) {
    progressCallback = options;
    options = {};
  }

  let tempKey = account.privateKey;
  if (!tempKey.startsWith('0x')) {
    tempKey = '0x' + tempKey;
  }

  const privateKey = arrayify(tempKey);
  const passwordBytes = getPassword(password);

  let client = options.client;
  if (!client) {
    client = 'tronlink-extension';
  }

  // Check/generate the salt
  let salt: any = null;
  if (options.salt) {
    salt = arrayify(options.salt);
  } else {
    salt = randomBytes(32);
  }

  // Override initialization vector
  let iv: any = null;
  if (options.iv) {
    iv = arrayify(options.iv);
    if (iv.length !== 16) {
      throw new Error('invalid iv');
    }
  } else {
    iv = randomBytes(16);
  }

  // Override the uuid
  let uuidRandom: any = null;
  if (options.uuid) {
    uuidRandom = arrayify(options.uuid);
    if (uuidRandom.length !== 16) {
      throw new Error('invalid uuid');
    }
  } else {
    uuidRandom = randomBytes(16);
  }

  // Override the scrypt password-based key derivation function parameters
  let N = 1 << 17,
    r = 8,
    p = 1;
  if (options.scrypt) {
    if (options.scrypt.N) {
      N = options.scrypt.N;
    }
    if (options.scrypt.r) {
      r = options.scrypt.r;
    }
    if (options.scrypt.p) {
      p = options.scrypt.p;
    }
  }

  // We take 64 bytes:
  //   - 32 bytes   As normal for the Web3 secret storage (derivedKey, macPrefix)
  //   - 32 bytes   AES key to encrypt mnemonic with (required here to be Ethers Wallet)
  return scrypt.scrypt(passwordBytes, salt, N, r, p, 64, progressCallback).then((key) => {
    key = arrayify(key);

    // This will be used to encrypt the wallet (as per Web3 secret storage)
    const derivedKey = key.slice(0, 16);
    const macPrefix = key.slice(16, 32);

    // This will be used to encrypt the mnemonic phrase (if any)
    // const mnemonicKey = key.slice(32, 64);

    // Encrypt the private key
    const counter = new aes.Counter(iv);
    const aesCtr = new aes.ModeOfOperation.ctr(derivedKey, counter);
    const ciphertext = arrayify(aesCtr.encrypt(privateKey));

    // Compute the message authentication code, used to check the password
    const mac = keccak256(concat([macPrefix, ciphertext]));

    // See: https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition
    const data = {
      address: TronWeb.address.toHex(account.address),
      id: uuidV4(),
      version: 3,
      crypto: {
        cipher: 'aes-128-ctr',
        cipherparams: {
          iv: hexlify(iv).substring(2),
        },
        ciphertext: hexlify(ciphertext).substring(2),
        kdf: 'scrypt',
        kdfparams: {
          salt: hexlify(salt).substring(2),
          n: N,
          dklen: 32,
          p: p,
          r: r,
        },
        mac: mac.substring(2),
      },
    };

    return JSON.stringify(data);
  });
}
