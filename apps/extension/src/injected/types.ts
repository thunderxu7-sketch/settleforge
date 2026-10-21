export type PhishingListType = Array<{ url: string; isVisit: boolean }>;

export interface ProxiedMethods {
  sign?: (
    transaction: any,
    privateKey: string | boolean,
    useTronHeader: boolean,
    callback: any,
  ) => void;
  multiSign?: () => void;

  setAddress?: (address: string) => void;
  setMainAddress?: (address: string) => void;
  setSideAddress?: (address: string) => void;

  tronLinkSetAddress?: (address: string) => void;
  tronLinkSetMainAddress?: (address: string) => void;
  tronLinkSetSideAddress?: (address: string) => void;
}

export interface RequestArgs {
  method: string;
  params: any;
}

export interface TronLinkType {
  ready: boolean;
  tronWeb?: any;
  sunWeb?: any;
  tronlinkParams?: any;
  request?: (args: RequestArgs) => void;
}
