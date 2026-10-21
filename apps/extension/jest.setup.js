const chrome = require('jest-chrome');
const crypto = require('crypto');
require('jest-fetch-mock').enableMocks();

Object.assign(global, chrome);

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
    subtle: crypto.webcrypto.subtle,
  },
});
