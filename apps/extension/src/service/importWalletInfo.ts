// custom path, custom third and fifth digits
export interface DefinePath {
  accountIndex?: number;
  addressIndex?: number;
}
export interface ImportWalletRouteParams {
  pathMode?: number[] | number;
  originText?: string;
  definePath?: DefinePath | boolean;
  type?: string;
  name?: string;
  number?: string; // what is this??
  password?: string;
}

export interface LedgerDefinePath {
  accountIndex?: number;
  addressIndex?: number;
  path?: string;
}

export interface LedgerWalletRouteParams {
  index?: number;
  address?: string;
  pathMode?: number[];
  selectAddress?: string[];
  definePath?: LedgerDefinePath;
}

export interface NewHDAddressParams {
  originAddress: string;
  originName: string;
  name?: string;
}

interface WalletInfo {
  importWalletRouteParams?: ImportWalletRouteParams;
  ledgerWalletRouteParams?: LedgerWalletRouteParams;
  newHDAddressParams?: NewHDAddressParams;
}

let importWalletInfo: WalletInfo = {};

export const clearImportWalletInfo = () => {
  importWalletInfo = {};
};

export const setImportWalletRouteParams = (value: ImportWalletRouteParams) => {
  importWalletInfo.importWalletRouteParams = value;
};

export const getImportWalletRouteParams = (): ImportWalletRouteParams | undefined =>
  importWalletInfo.importWalletRouteParams;

export const setLedgerWalletRouteParams = (value: LedgerWalletRouteParams) => {
  importWalletInfo.ledgerWalletRouteParams = value;
};

export const getLedgerWalletRouteParams = (): LedgerWalletRouteParams => {
  return importWalletInfo.ledgerWalletRouteParams || {};
};

export const setNewHDAddressParams = (value: NewHDAddressParams) => {
  importWalletInfo.newHDAddressParams = value;
};

export const getNewHDAddressParams = (): NewHDAddressParams | undefined =>
  importWalletInfo.newHDAddressParams;
