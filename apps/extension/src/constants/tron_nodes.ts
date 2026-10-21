import { CONTRACT_ADDRESS } from './contracts';
import { CONFIG_MAIN, CONFIG_NILE, CONFIG_SHASTA } from './api';

// Local-only build: the TronGrid API key is injected from the TRON_PRO_API_KEY
// env var at build time (see .env.example / webpack DefinePlugin). Empty by
// default — TronGrid works without a key at a lower rate limit.
export const TRONGRID_API_KEY = __TRON_PRO_API_KEY__;
export const MAIN_CHAIN_ID = '_';
export const DAPP_CHAIN_ID = '41E209E4DE650F0150788E8EC5CAFA240A23EB8EB7';
export const DAPP_CHAIN_ID_TEST = '413AF23F37DA0D48234FDD43D89931E98E1144481B';

// full node for main net
export const FULL_NODE_TRONGRID = 'https://api.trongrid.io';
export const FULL_NODE_TRONSTACK = 'https://api.tronstack.io';

// full node for test net
export const FULL_NODE_SHASTA = 'https://api.shasta.trongrid.io';
export const FULL_NODE_NILE = 'https://api.nileex.io';
export const EVENT_SERVER_NILE = 'https://event.nileex.io';

// full node for dappchain
export const FULL_NODE_DAPP_CHAIN_MAIN_NET = 'https://sun.tronex.io';
export const FULL_NODE_DAPP_CHAIN_TEST_NET = 'https://suntest.tronex.io';

// tronscan
export const TRON_SCAN_IO = 'https://tronscan.org/';
export const TRON_SCAN_NILE = 'https://nile.tronscan.org/';
export const TRON_SCAN_SHASTA = 'https://shasta.tronscan.org/';

export const TRON_SCAN_IO_DAPP_CHAIN = 'https://dappchain.tronscan.org/';

export const NODE_ID_MAIN = '109c64ad-e59c-46fe-ba87-179587e6c772';
export const NODE_ID_TRONSTACK = '8eeb5be6-5e10-4283-ae61-03c0e4726fe0';
export const NODE_ID_SHASTA = 'b9424719-b45b-45aa-95d0-1b1b25fc75ae';
export const NODE_ID_NILE = '910d7fa5-da35-419d-b454-fd4ee22087cd';
export const NODE_ID_MAIN_DAPP_CHAIN = '51a36e5a-2480-4b57-989c-539345a13be2';
export const NODE_ID_TEST_DAPP_CHAIN = '01eda3a0-5a58-4e44-9f95-f7f1f59dd728';

const NODE_ID_TRONEX_TEST = 'f14212e2-a6a0-4391-9419-07b55f8be63e';

export const OTHER_NODES_INFO = {
  [NODE_ID_TRONEX_TEST]: {
    name: 'Tronex Testnet',
    formatName: 'NODE.NAME.TRONEX',
    fullNode: 'https://testhttpapi.tronex.io',
    solidityNode: 'https://testhttpapi.tronex.io',
    eventServer: 'https://testapi.tronex.io',
    default: false,
    chain: '_',
    connect: '01eda3a0-5a58-4e44-9f95-f7f1f59dd728',
    chainType: 0,
    netType: 1,
    connectChain: {
      fullNode: 'https://suntest.tronex.io',
      solidityNode: 'https://suntest.tronex.io',
      eventServer: 'https://suntest.tronex.io',
      mainGateway: CONTRACT_ADDRESS.MAIN_TEST,
      sideGateway: CONTRACT_ADDRESS.SIDE_TEST,
      chainId: DAPP_CHAIN_ID_TEST,
    },
    hostname: 'https://tronscan.org/#',
    freezeUrl: 'https://tronscan.org/#/wallet/resources?from=tronlink',
    multiSignUrl: 'https://tronscan.org/#/wallet/multiSignature?from=tronlink',
    accountUrl: 'https://tronscan.org/#/wallet?from=tronlink',
    voteUrl: 'https://tronscan.org/#/sr/votes?from=tronlink',
  },
};

export const DEFAULT_TRONSCAN_INFO = {
  hostname: TRON_SCAN_IO + '#',
  freezeUrl: TRON_SCAN_IO + '#/wallet/resources?from=tronlink',
  multiSignUrl: TRON_SCAN_IO + '#/wallet/multiSignature?from=tronlink',
  accountUrl: TRON_SCAN_IO + '#/wallet?from=tronlink',
  voteUrl: TRON_SCAN_IO + '#/sr/votes?from=tronlink',
};

export const TRON_NODES = {
  [NODE_ID_MAIN]: {
    name: 'Mainnet (trongrid)',
    formatName: 'NODE.NAME.TRON_GRID',
    fullNode: FULL_NODE_TRONGRID,
    solidityNode: FULL_NODE_TRONGRID,
    eventServer: FULL_NODE_TRONGRID,
    default: true, // false
    isCanDelete: false,
    chain: '_',
    connect: NODE_ID_MAIN_DAPP_CHAIN,
    chainType: 0, // 0: Tron, 1: DappChain
    netType: 0,
    headers: {
      'TRON-PRO-API-Key': TRONGRID_API_KEY,
    },
    connectChain: {
      fullNode: FULL_NODE_DAPP_CHAIN_MAIN_NET,
      solidityNode: FULL_NODE_DAPP_CHAIN_MAIN_NET,
      eventServer: FULL_NODE_DAPP_CHAIN_MAIN_NET,
      mainGateway: CONTRACT_ADDRESS.MAIN,
      sideGateway: CONTRACT_ADDRESS.SIDE,
      chainId: DAPP_CHAIN_ID,
    },
    apiConfig: CONFIG_MAIN,
    ...DEFAULT_TRONSCAN_INFO,
    formatTip: '',
  },
  [NODE_ID_TRONSTACK]: {
    name: 'Mainnet (tronstack)',
    formatName: 'NODE.NAME.TRON_STACK',
    fullNode: FULL_NODE_TRONSTACK,
    solidityNode: FULL_NODE_TRONSTACK,
    eventServer: FULL_NODE_TRONSTACK,
    default: false,
    isCanDelete: false,
    chain: '_',
    chainType: 0, // 0: Tron, 1: DappChain
    netType: 0, // 0: mainnet, 1: testnet
    connectChain: false,
    apiConfig: CONFIG_MAIN,
    ...DEFAULT_TRONSCAN_INFO,
    formatTip: '',
  },
  [NODE_ID_SHASTA]: {
    name: 'Shasta Testnet',
    formatName: 'NODE.NAME.SHASTA',
    fullNode: FULL_NODE_SHASTA,
    solidityNode: FULL_NODE_SHASTA,
    eventServer: FULL_NODE_SHASTA,
    default: false,
    isCanDelete: false,
    chain: '_',
    chainType: 0,
    netType: 1,
    connectChain: false,
    apiConfig: CONFIG_SHASTA,
    hostname: TRON_SCAN_SHASTA + '#',
    freezeUrl: TRON_SCAN_SHASTA + '#/account?from=tronlink&type=frozen',
    multiSignUrl: TRON_SCAN_SHASTA + '#/account?from=tronlink&type=multiSign',
    accountUrl: TRON_SCAN_SHASTA + '#/account?from=tronlink',
    voteUrl: TRON_SCAN_SHASTA + '#/sr/votes?from=tronlink',
    formatTip: 'NODE.TIP.TESTNET',
  },
  [NODE_ID_NILE]: {
    name: 'Nile Testnet',
    formatName: 'NODE.NAME.NILE',
    fullNode: FULL_NODE_NILE,
    solidityNode: FULL_NODE_NILE,
    eventServer: EVENT_SERVER_NILE,
    default: false,
    isCanDelete: false,
    chain: '_',
    chainType: 0,
    netType: 1,
    connectChain: false,
    apiConfig: CONFIG_NILE,
    hostname: TRON_SCAN_NILE + '#',
    freezeUrl: TRON_SCAN_NILE + '#/account?from=tronlink&type=frozen',
    multiSignUrl: TRON_SCAN_NILE + '#/account?from=tronlink&type=multiSign',
    accountUrl: TRON_SCAN_NILE + '#/account?from=tronlink',
    voteUrl: TRON_SCAN_NILE + '#/sr/votes?from=tronlink',
    formatTip: 'NODE.TIP.TESTNET',
  },
  [NODE_ID_MAIN_DAPP_CHAIN]: {
    name: 'DappChain Mainnet',
    formatName: 'NODE.NAME.DAPPCHAIN',
    fullNode: FULL_NODE_DAPP_CHAIN_MAIN_NET,
    solidityNode: FULL_NODE_DAPP_CHAIN_MAIN_NET,
    eventServer: FULL_NODE_DAPP_CHAIN_MAIN_NET,
    default: true,
    isCanDelete: false,
    chain: DAPP_CHAIN_ID,
    connect: NODE_ID_MAIN,
    chainType: 1,
    netType: 0,
    mainGateway: CONTRACT_ADDRESS.MAIN,
    sideGateway: CONTRACT_ADDRESS.SIDE,
    sideChainId: DAPP_CHAIN_ID,
    connectChain: {
      fullNode: FULL_NODE_TRONGRID,
      solidityNode: FULL_NODE_TRONGRID,
      eventServer: FULL_NODE_TRONGRID,
    },
    apiConfig: CONFIG_MAIN,
    hostname: TRON_SCAN_IO_DAPP_CHAIN + '#',
    freezeUrl: TRON_SCAN_IO_DAPP_CHAIN + '#/wallet/resources?from=tronlink',
    multiSignUrl: TRON_SCAN_IO_DAPP_CHAIN + '#/wallet/multiSignature?from=tronlink',
    accountUrl: TRON_SCAN_IO_DAPP_CHAIN + '#/wallet?from=tronlink',
    voteUrl: TRON_SCAN_IO_DAPP_CHAIN + '#/sr/votes?from=tronlink',
    formatTip: 'NODE.TIP.DAPPCHAIN',
  },
  [NODE_ID_TEST_DAPP_CHAIN]: {
    name: 'DappChain Tronex Testnet',
    formatName: 'NODE.NAME.DAPPCHAIN_TESTNET',
    fullNode: FULL_NODE_DAPP_CHAIN_TEST_NET,
    solidityNode: FULL_NODE_DAPP_CHAIN_TEST_NET,
    eventServer: FULL_NODE_DAPP_CHAIN_TEST_NET,
    default: false,
    isCanDelete: false,
    chain: DAPP_CHAIN_ID,
    connect: NODE_ID_TRONEX_TEST,
    chainType: 1,
    netType: 1,
    mainGateway: CONTRACT_ADDRESS.MAIN_TEST,
    sideGateway: CONTRACT_ADDRESS.SIDE_TEST,
    sideChainId: DAPP_CHAIN_ID_TEST,
    connectChain: {
      fullNode: 'https://testhttpapi.tronex.io',
      solidityNode: 'https://testhttpapi.tronex.io',
      eventServer: 'https://testapi.tronex.io',
    },
    apiConfig: CONFIG_NILE,
    hostname: TRON_SCAN_IO_DAPP_CHAIN + '#',
    freezeUrl: TRON_SCAN_IO_DAPP_CHAIN + '#/wallet/resources?from=tronlink',
    multiSignUrl: TRON_SCAN_IO_DAPP_CHAIN + '#/wallet/multiSignature?from=tronlink',
    accountUrl: TRON_SCAN_IO_DAPP_CHAIN + '#/wallet?from=tronlink',
    voteUrl: TRON_SCAN_IO_DAPP_CHAIN + '#/sr/votes?from=tronlink',
    formatTip: 'NODE.TIP.DAPPCHAIN_TESTNET',
  },
};

export const DEFAULT_NODE_IDS = [
  NODE_ID_MAIN,
  NODE_ID_TRONSTACK,
  NODE_ID_SHASTA,
  NODE_ID_NILE,
  NODE_ID_MAIN_DAPP_CHAIN,
  NODE_ID_TEST_DAPP_CHAIN,
];

export const DEFAULT_SELECTED_NODE = NODE_ID_MAIN;
export const DEFAULT_MAIN_NODE_IDS = [NODE_ID_MAIN, NODE_ID_TRONSTACK, NODE_ID_MAIN_DAPP_CHAIN];

export const NODE_FORMAT_ID = {
  [NODE_ID_MAIN]: {
    net: 'CONFIRMATIONS.NEW.NETWORK.MAIN_NET',
    chain: 'CONFIRMATIONS.NEW.NETWORK.MAINCHAIN',
  },
  [NODE_ID_SHASTA]: {
    net: 'CONFIRMATIONS.NEW.NETWORK.SHASTA_NET',
    chain: 'CONFIRMATIONS.NEW.NETWORK.MAINCHAIN',
  },
  [NODE_ID_TRONSTACK]: {
    net: 'CONFIRMATIONS.NEW.NETWORK.MAIN_NET',
    chain: 'CONFIRMATIONS.NEW.NETWORK.MAINCHAIN',
  },
  [NODE_ID_NILE]: {
    net: 'CONFIRMATIONS.NEW.NETWORK.NILE_NET',
    chain: 'CONFIRMATIONS.NEW.NETWORK.MAINCHAIN',
  },
  [NODE_ID_MAIN_DAPP_CHAIN]: {
    net: 'CONFIRMATIONS.NEW.NETWORK.MAIN_NET',
    chain: 'CONFIRMATIONS.NEW.NETWORK.DAPPCHAIN',
  },
  [NODE_ID_TEST_DAPP_CHAIN]: {
    net: 'CONFIRMATIONS.NEW.NETWORK.TRONEX_NET',
    chain: 'CONFIRMATIONS.NEW.NETWORK.DAPPCHAIN',
  },
};

export const NODE = {
  //MAIN: {fullNode:'http://47.252.84.158:8070',solidityNode:'http://47.252.84.158:8071',eventServer:'http://47.252.81.14:8070'},
  //SIDE: {fullNode:'http://47.252.85.90:8070',solidityNode:'http://47.252.85.90:8071',eventServer:'http://47.252.87.129:8070'},
  MAIN: {
    fullNode: 'https://api.trongrid.io',
    solidityNode: 'https://api.trongrid.io',
    eventServer: 'https://api.trongrid.io',
  },
  SIDE: {
    fullNode: 'https://sun.tronex.io',
    solidityNode: 'https://sun.tronex.io',
    eventServer: 'https://sun.tronex.io',
  },
};

export const SIDE_CHAIN_ID = '41E209E4DE650F0150788E8EC5CAFA240A23EB8EB7';
export const SIDE_CHAIN_ID_TEST = '413AF23F37DA0D48234FDD43D89931E98E1144481B';
