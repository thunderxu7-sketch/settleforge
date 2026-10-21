export class NameExistError extends Error {
  constructor(message = 'WALLET.IMPORT.NAME_REPEAT.ERROR') {
    super(message);
  }
}

export class DataError extends Error {
  constructor(message = 'ERRORS.INVALID_PASSWORD_RETRY') {
    super(message);
  }
}

export class AddressExistError extends Error {
  constructor(message = 'CREATION.RESTORE.KEY_STORE.EXCEPTION.ACCOUNT_EXIST') {
    super(message);
  }
}

export class AddressInvalidError extends Error {
  constructor(message = 'EXCEPTION.SEND.ADDRESS_FORMAT_ERROR') {
    super(message);
  }
}

export class MnemonicPhaseError extends Error {
  constructor(message = 'WALLET.IMPORT.MNEMONIC.ERROR_TIP') {
    super(message);
  }
}

export class SelectedAccountError extends Error {
  constructor(message = 'selected account error') {
    super(message);
  }
}

export class OnlyOneAddressLeftError extends Error {
  constructor(message = 'ALERT.DELETE_ACCOUNT.ONLY_ONE') {
    super(message);
  }
}
