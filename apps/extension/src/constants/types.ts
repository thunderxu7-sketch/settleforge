import bigNumber from 'bignumber.js';

enum TokenType {
  TRX,
  TRC10,
  TRC20,
  TRC721 = 5,
}
interface CommonTokenType {
  balance: number;
  balanceStr: string;
  contractAddress: string;
  homePage: string;
  id: string;
  inMainChain: boolean;
  inSideChain: boolean;
  isInAssets: boolean;
  isOfficial: number;
  isShield: boolean;
  issueAddress: string;
  issueTime: string;
  logoUrl: string;
  maincontractAddress: string;
  marketId: number;
  name: string;
  precision: number;
  price: number;
  recommandSortId: number;
  shortName: string;
  tokenDesc: string;
  tokenStatus: number;
  top: number;
  totalBalance: number;
  totalSupply: number;
  totalSupplyStr: string;
  transferStatus: boolean;
  trxCount: number;
  type: TokenType;
  usdPrice: string;
  usdCount: number;
  cnyPrice: string;
  cnyCount: number;
  originIndex?: number; // added by front for manual sort
}

interface NFTTokenType {
  contractAddress: string;
  count: number;
  homePage: string;
  id: string;
  inMainChain: boolean;
  inSideChain: boolean;
  isOfficial: number;
  issueAddress: string;
  issueTime: string;
  logoUrl: string;
  maincontractAddress: string;
  marketId: number;
  name: string;
  nrOfTokenHolders: number;
  shortName: string;
  tokenDesc: string;
  tokenStatus: number;
  top: number;
  totalSupply: number;
  totalSupplyStr: string;
  transferCount: number;
  transferStatus: boolean;
  type: TokenType;
  originIndex?: number; // added by front for manual sort
}

export interface AssetItemType extends CommonTokenType, NFTTokenType {}

export type AssetType = Array<AssetItemType> | [];

export interface CollectionType {
  tokenAddress: string;
  assetId: string;
  name: string;
  intro: string;
  price: string;
  logoUrl: string;
  imageUrl: string;
  assetUri: string;
}

export type AllLocalTokensType =
  | {
      followedAsset: AssetType;
      followedCollection: AssetType;
      unFollowedAsset: AssetType;
      unFollowedCollection: AssetType;
      newAsset: AssetType;
      newCollection: AssetType;
    }
  | Record<string, any>;

export type BigNumberType = bigNumber;

export type CustomTokenInfoType = {
  totalSupply: number;
  type: number;
  name: string;
  abbr: string;
  decimal: number;
  contractAddress: string;
  logoUrl: string;
  price: number;
  trxCount: BigNumberType;
  noFunctions: string[];
  usdPrice: string;
  usdCount: number;
  cnyPrice: string;
  cnyCount: number;
};

export enum WindowType {
  POPUP,
  SECONDARY,
}
