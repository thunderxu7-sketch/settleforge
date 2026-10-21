export const CONFIRMATION_TYPE = {
  STRING: 0,
  TRANSACTION: 1,
};

export const REFER_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      {
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      {
        name: 'decimals',
        type: 'uint8',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
];

export type NormalParamsInfoType = {
  fromAddress: string;
  toAddress: string;
  amount: string | BigNumber | number;
  fromAddressName: string;
  toAddressName: string;
  unit: string;
  contractType: string;
  rawDataHex: string;
  tokenInfo: any;
};

export type TriggerSmartContractParamsInfoType = {
  toAddress: string;
  contractAddress: string;
  functionName: string;
  tokenInfo: {
    isRisk: boolean;
  };
  args: Array<any>;
  rawDataHex: string;
  callValue: string;
  callValueUnit: string;
};

export type TransferContractParamsInfoType = {
  fromAddress: string;
  toAddress: string;
  amount: string;
  decimal: number;
  fromAddressName: string;
  unit: string;
  contractType: string;
  rawDataHex: string;
  tokenInfo: {
    symbol: string;
    precision: number;
    type: number;
    isOfficial: number;
  };
};

export type TransferAssetContractParamsInfoType = {
  fromAddress: string;
  toAddress: string;
  tokenId: string;
  amount: number;
  fromAddressName: string;
  contractType: string;
  rawDataHex: string;
  tokenInfo: {
    isRisk: boolean;
    type: number;
    top: number;
    isOfficial: number;
    name: string;
    shortName: string;
    id: string;
    contractAddress: string;
    balance: number;
    balanceStr: string;
    totalBalance: number;
    trxCount: number;
    price: number;
    logoUrl: string;
    precision: number;
    inMainChain: boolean;
    inSideChain: boolean;
    maincontractAddress: string;
    homePage: string;
    isInAssets: boolean;
    isShield: boolean;
    tokenDesc: string;
    issueTime: string;
    issueAddress: string;
    totalSupply: number;
    totalSupplyStr: string;
    marketId: number;
    recommandSortId: number;
    tokenStatus: number;
    transferStatus: boolean;
  };
};

export type VoteWitnessContractParamsInfoType = {
  fromAddress: string;
  votes: Array<{
    vote_address: string;
    vote_count: number;
  }>;
  rawDataHex: string;
  superNodeInfo: Array<{
    address: string;
    voteCount: number;
    name: string;
  }>;
  amount: string;
};

export type FreezeBalanceContractParamsInfoType = {
  resource: string;
  fromAddress: string;
  toAddress: string;
  frozenBalance: string;
  fromAddressName: string;
  rawDataHex: string;
};

// todos need to confirm unfreeze balance object structure
export type UnFreezeBalanceContractParamsInfoType = {
  resource: string;
  fromAddress: string;
  toAddress: string;
  unFrozenBalance: string;
  fromAddressName: string;
  rawDataHex: string;
};

export type DefaultParamsInfoType = {
  contractType: string;
  rawDataHex: string;
};
