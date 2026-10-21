import log from 'loglevel';
// @ts-ignore
import TronWeb from 'tronweb';

import { CONTRACT_ADDRESS } from '../constants/contracts';
import { NODE, SIDE_CHAIN_ID, SIDE_CHAIN_ID_TEST } from '../constants/tron_nodes';
import { PhishingListType, ProxiedMethods } from './types';

declare global {
  interface Window {
    sunWeb: any;
    tronWeb: any;
    tronLink: any;
  }
}

const notifyKeys = [
  'transactionBuilder',
  'trx',
  'ready',
  'isTronLink',
  'sha3',
  'toHex',
  'toUtf8',
  'fromUtf8',
  'toAscii',
  'fromAscii',
  'toDecimal',
  'fromDecimal',
  'toSun',
  'fromSun',
  'toBigNumber',
  'createAccount',
  'address',
  'version',
  'utils',
  'BigNumber',
  'getEventByTransactionID',
  'getEventResult',
  'contract',
  'setAddress',
  'setFullNode',
  'setFullNodeHeader',
  'setHeader',
];

let _showWarn = true;
let _isDisable = false;

let _preAddress: string | undefined = undefined;

export const getPreAddress = () => {
  return _preAddress;
};

export const setPreAddress = (address: string) => {
  _preAddress = address;
};

export async function setGlobalProvider(
  tronWebProvider: TronWeb,
  sunWebProvider: TronWeb,
  tronLinkProvider: TronWeb,
) {
  tronWebProvider.isTronLink = true;
  sunWebProvider.isTronLink = true;

  window.sunWeb = _bindProxy(sunWebProvider);
  window.tronWeb = _bindProxy(tronWebProvider);
  window.tronLink = _tronLinkBindProxy(tronLinkProvider);
}

export function disconnectWebsite(web: { origin: string }) {
  const { origin } = location;
  if (web && origin === web.origin) {
    _disableTronWeb();
    _disableTronWallet(window.tronLink);

    // TODO: tricky, delay the disconnect message after tabReply
    setTimeout(() => {
      postMessageToUser('disconnect');
    }, 20);
  }
}

export function setIsDisable(isDisable = false) {
  _isDisable = isDisable;
}

export function getIsDisable() {
  return _isDisable;
}

export async function configureMetadata() {
  if (document.readyState === 'complete') {
    await _getSiteMetadata();
  } else {
    const domContentLoadedHandler = () => {
      _getSiteMetadata();
      window.removeEventListener('load', domContentLoadedHandler);
    };
    window.addEventListener('load', domContentLoadedHandler);
  }
}

export function disableDefaultAddress(provider: TronWeb, sideProvider: TronWeb) {
  if (provider) {
    provider.defaultAddress = {
      hex: false,
      base58: false,
    };
  }
  if (sideProvider) {
    sideProvider.mainchain.defaultAddress = {
      hex: false,
      base58: false,
    };
    sideProvider.sidechain.defaultAddress = {
      hex: false,
      base58: false,
    };
  }
  provider.ready = false;
}

export function initTronWalletParams(
  address: string,
  node: any,
  name: string,
  type: 0 | 1 | 2,
  phishingList: PhishingListType,
  connectNode: any = false,
  isAuth = false,
  proxyMethods: any,
) {
  if (isAuth && window.tronLink && window.tronLink.tronWeb) {
    const tronLinkTronWeb = window.tronLink.tronWeb;
    const tronLinkSunWeb = window.tronLink.sunWeb;
    if (address) {
      if (tronLinkTronWeb.isAddress(address)) {
        window.tronLink.ready = true;
      }
      setAddressTronWallet({ address, name, type }, tronLinkTronWeb, tronLinkSunWeb, proxyMethods);
    }
    if (node.fullNode) {
      setNodeCommon({ node, connectNode }, tronLinkTronWeb, tronLinkSunWeb);
    }
  } else if (!isAuth) {
    _disableTronWallet(window.tronLink);
  }
}

function _bindProxy(targetObj: any) {
  return new Proxy(targetObj, {
    get: function (target, prop) {
      // @ts-ignore
      if (_isDisable && !['request', 'isAddress'].includes(prop)) {
        return false;
      }
      // @ts-ignore
      if (notifyKeys.includes(prop)) {
        // notify connect website
        if (!_isDisable) {
          _innerEnable(target);
        }
      }
      return target[prop];
    },
    deleteProperty: () => true,
  });
}

function _tronLinkBindProxy(targetObj: any) {
  return new Proxy(targetObj, {
    deleteProperty: () => true,
  });
}

async function _getSiteMetadata() {
  const tronlinkParams = {
    websiteName: _getSiteName(),
    websiteIcon: await _getSiteIcon(),
  };
  window.sunWeb.tronlinkParams = Object.assign({}, window.sunWeb.tronlinkParams, tronlinkParams);
  window.tronWeb.tronlinkParams = Object.assign({}, window.tronWeb.tronlinkParams, tronlinkParams);
  window.tronLink.tronlinkParams = Object.assign(
    {},
    window.tronLink.tronlinkParams,
    tronlinkParams,
  );
}

async function _innerEnable(handler: any) {
  if (_showWarn) {
    _showWarn = false;
    console.warn(
      "[TronLink] We recommend that DApp developers use %ctronLink.request({method: 'tron_requestAccounts'})",
      'color: red;',
      'to request users’ account information at the earliest time possible in order to get a complete TronWeb injection and to ensure proper connection of your DApp to TronLink extension wallet.',
    );
  }
  if (handler && handler.request) {
    if (!(handler.tronlinkParams && handler.tronlinkParams.websiteIcon)) {
      await _getSiteMetadata();
    }
    const res = await handler.request({
      method: 'tron_requestAccounts',
    });
    if (res && res.code === 4001) {
      _disableTronWeb();
      _disableTronWallet(window.tronLink);
    }
  }
}

/**
 * Extracts a name for the site from the DOM
 */
function _getSiteName() {
  const siteName = document.querySelector('head > meta[property="og:site_name"]');
  if (siteName) {
    // @ts-ignore
    return siteName.content;
  }
  const metaTitle = document.querySelector('head > meta[name="title"]');
  if (metaTitle) {
    // @ts-ignore
    return metaTitle.content;
  }
  if (document.title && document.title.length > 0) {
    return document.title;
  }
  return window.location.hostname;
}

/**
 * Extracts an icon for the site from the DOM
 * @returns an icon URL
 */
async function _getSiteIcon() {
  const icons = document.querySelectorAll('head > link[rel~="icon"]');
  // @ts-ignore
  for (const icon of icons) {
    if (icon && (await _imgExists(icon.href))) {
      return icon.href;
    }
  }
  return null;
}

/**
 * Returns whether the given image URL exists
 * @param url - the url of the image
 * @returns Whether the image exists.
 */
function _imgExists(url: string) {
  return new Promise((resolve, reject) => {
    try {
      const img = document.createElement('img');
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

function _disableTronWeb() {
  disableDefaultAddress(window.tronWeb, window.sunWeb);
  _isDisable = true;
}

function _disableTronWallet(obj: any) {
  if (obj) {
    // Destroy the original heap variable
    if (typeof obj.tronWeb === 'object') {
      const tronLinkTronWeb = obj.tronWeb;
      for (const key of Object.keys(tronLinkTronWeb)) {
        tronLinkTronWeb[key] = false;
      }
    }
    if (typeof obj.sunWeb === 'object') {
      const tronLinkSunWeb = obj.sunWeb;
      for (const key of Object.keys(tronLinkSunWeb)) {
        tronLinkSunWeb[key] = false;
      }
    }
    obj.ready = false;
    obj.tronWeb = false;
    obj.sunWeb = false;
  }
}

export function setNodeCommon(node: any, provider: TronWeb, sideProvider: TronWeb) {
  if (node.node.chain === '_') {
    provider.fullNode.configure(node.node.fullNode);
    provider.solidityNode.configure(node.node.solidityNode);
    provider.eventServer.configure(node.node.eventServer);

    sideProvider.mainchain.fullNode.configure(node.node.fullNode);
    sideProvider.mainchain.solidityNode.configure(node.node.solidityNode);
    sideProvider.mainchain.eventServer.configure(node.node.eventServer);

    if (node.connectNode) {
      sideProvider.sidechain.fullNode.configure(node.connectNode.fullNode);
      sideProvider.sidechain.solidityNode.configure(node.connectNode.solidityNode);
      sideProvider.sidechain.eventServer.configure(node.connectNode.eventServer);

      _setSideGatewayInfo(node.connectNode, sideProvider);
    } else {
      sideProvider.sidechain.fullNode.configure(NODE.SIDE.fullNode);
      sideProvider.sidechain.solidityNode.configure(NODE.SIDE.solidityNode);
      sideProvider.sidechain.eventServer.configure(NODE.SIDE.eventServer);

      _setSideGatewayInfo(NODE.SIDE, sideProvider);
    }
  } else {
    if (node.connectNode) {
      provider.fullNode.configure(node.connectNode.fullNode);
      provider.solidityNode.configure(node.connectNode.solidityNode);
      provider.eventServer.configure(node.connectNode.eventServer);

      sideProvider.mainchain.fullNode.configure(node.connectNode.fullNode);
      sideProvider.mainchain.solidityNode.configure(node.connectNode.solidityNode);
      sideProvider.mainchain.eventServer.configure(node.connectNode.eventServer);

      sideProvider.sidechain.fullNode.configure(node.node.fullNode);
      sideProvider.sidechain.solidityNode.configure(node.node.solidityNode);
      sideProvider.sidechain.eventServer.configure(node.node.eventServer);

      _setSideGatewayInfo(node.node, sideProvider);
    }
  }
}

function _setSideGatewayInfo(node: any, provider: TronWeb) {
  if (!provider) {
    return;
  }
  if (node.fullNode === 'https://suntest.tronex.io') {
    provider.setMainGatewayAddress(CONTRACT_ADDRESS.MAIN_TEST);
    provider.setSideGatewayAddress(CONTRACT_ADDRESS.SIDE_TEST);
    provider.setChainId(SIDE_CHAIN_ID_TEST);
  } else {
    provider.setMainGatewayAddress(CONTRACT_ADDRESS.MAIN);
    provider.setSideGatewayAddress(CONTRACT_ADDRESS.SIDE);
    provider.setChainId(SIDE_CHAIN_ID);
  }
}

export function setAddressTronWallet(
  { address, name, type }: { address: string; name: string; type: number },
  provider: TronWeb,
  sideProvider: TronWeb,
  proxyMethods: ProxiedMethods = {},
) {
  if (!provider.isAddress(address)) {
    disableDefaultAddress(provider, sideProvider);
  } else {
    if (provider) {
      proxyMethods.tronLinkSetAddress && proxyMethods.tronLinkSetAddress(address);
      provider.defaultAddress.name = name;
      provider.defaultAddress.type = type;
    }
    if (sideProvider) {
      proxyMethods.tronLinkSetMainAddress && proxyMethods.tronLinkSetMainAddress(address);
      proxyMethods.tronLinkSetSideAddress && proxyMethods.tronLinkSetSideAddress(address);
      sideProvider.mainchain.defaultAddress.name = name;
      sideProvider.mainchain.defaultAddress.type = type;
      sideProvider.sidechain.defaultAddress.name = name;
      sideProvider.sidechain.defaultAddress.type = type;
    }
    provider.ready = true;
  }
}

export const disabledMethod = () => {
  new Error('TronLink has disabled this method');
};

export const injectPromise = (func: (...args: any) => void, ...args: any) => {
  return new Promise((resolve, reject) => {
    func(...args, (err: any, res: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

export const postMessageToUser = (action: string, data?: Record<string, any>): void => {
  const message: Record<string, any> = {
    action,
  };
  if (data !== undefined) {
    message['data'] = data;
  }
  window.postMessage(
    {
      message,
      isTronLink: true,
    },
    '*',
  );
};

export const deprecateBroadcastMessage = (
  action:
    | 'tabReply'
    | 'rejectWeb'
    | 'disconnectWeb'
    | 'connectWeb'
    | 'acceptWeb'
    | 'setAccount'
    | 'setNode',
  data?: Record<string, any>,
): void => {
  // TODO: compatible with version 3.x, deprecate in future
  log.warn('Deprecation warning: tabReply will be removed');

  const message: Record<string, any> = {
    action,
  };
  if (data !== undefined) {
    message['data'] = data;
  }
  window.postMessage(
    {
      message,
      source: 'contentScript',
      isTronLink: true,
    },
    '*',
  );
};
