import log from 'loglevel';
// @ts-ignore
import TronWeb from 'tronweb';

import { EventTunnelClient, NOTIFY_EVENT } from '../lib/event_tunnel';
import { RequestHandler } from './request_handler';
import type { PhishingListType, ProxiedMethods, RequestArgs } from './types';
import { TronLinkType } from './types';
import ProxiedProvider from './proxied_provider';
import { CONTRACT_ADDRESS } from '../constants/contracts';
import { SIDE_CHAIN_ID } from '../constants/tron_nodes';
import {
  configureMetadata,
  deprecateBroadcastMessage,
  disableDefaultAddress,
  disabledMethod,
  disconnectWebsite,
  getIsDisable,
  getPreAddress,
  initTronWalletParams,
  injectPromise,
  postMessageToUser,
  setAddressTronWallet,
  setGlobalProvider,
  setIsDisable,
  setNodeCommon,
  setPreAddress,
} from './utils';

const Utils = TronWeb.utils;

// @ts-ignore
log.setDefaultLevel(`${__LOGGER_LEVEL__}`);

class InjectedScript {
  eventTunnel: EventTunnelClient;
  requestHandler: RequestHandler;
  proxiedMethods: ProxiedMethods;

  constructor() {
    this.eventTunnel = new EventTunnelClient('injected');
    this.requestHandler = new RequestHandler(this.eventTunnel);
    this.proxiedMethods = {};
  }

  async init() {
    this.bindNotifyEvents();
    this.expose();

    await this._initRequest();
  }

  private bindNotifyEvents() {
    this.eventTunnel.on(NOTIFY_EVENT, (event: any) => {
      log.debug('got notify event', event);
      if (!event.action) {
        return;
      }
      switch (event.action) {
        case 'acceptWeb': {
          deprecateBroadcastMessage('acceptWeb', event.data);
          this._connectWebsite(event.data);
          break;
        }
        case 'connectWeb': {
          deprecateBroadcastMessage('connectWeb', event.data);
          this._connectWebsite(event.data);
          break;
        }
        case 'rejectWeb': {
          deprecateBroadcastMessage('rejectWeb', event.data);
          disconnectWebsite(event.data);
          break;
        }
        case 'disconnectWeb': {
          deprecateBroadcastMessage('disconnectWeb', event.data);
          disconnectWebsite(event.data);
          break;
        }
        case 'changeAddress': {
          deprecateBroadcastMessage('setAccount', event.data);
          this.onAddressChange(event.data).then();
          break;
        }
        case 'setNode': {
          deprecateBroadcastMessage('setNode', event.data);
          setNodeCommon(event.data, window.tronWeb, window.sunWeb);
          if (window.tronLink.tronWeb) {
            setNodeCommon(event.data, window.tronLink.tronWeb, window.tronLink.sunWeb);
          }
          break;
        }
      }
    });
  }

  private expose() {
    if (window.tronWeb !== undefined) {
      log.info(
        '[TronLink] TronWeb is already initiated. TronLink will overwrite the current instance',
      );
    }

    const { tronWeb, sunWeb, tronLink } = this._createTronWeb();
    setGlobalProvider(tronWeb, sunWeb, tronLink).catch((e: any) => log.info('inject error:', e));

    configureMetadata().catch((e: any) => log.info('configureMetadata error:', e));
  }

  private _createTronWeb(isTronWallet = false) {
    const tronWeb = new TronWeb(
      new ProxiedProvider(),
      new ProxiedProvider(),
      new ProxiedProvider(),
      {
        fullNode: new ProxiedProvider(),
        solidityNode: new ProxiedProvider(),
        eventServer: new ProxiedProvider(),
        mainGatewayAddress: CONTRACT_ADDRESS.MAIN,
        sideGatewayAddress: CONTRACT_ADDRESS.SIDE,
        sideChainId: SIDE_CHAIN_ID,
      },
    );

    const sunWeb = tronWeb.sidechain;

    const tronLink: TronLinkType = {
      ready: false,
    };

    tronWeb.extension = {}; //add an extension object for black list
    tronWeb.extension.setVisited = (href: string) => {
      this.setVisited(href);
    };

    if (isTronWallet) {
      this.proxiedMethods.tronLinkSetAddress = tronWeb.setAddress.bind(tronWeb);
      this.proxiedMethods.tronLinkSetMainAddress = sunWeb.mainchain.setAddress.bind(
        sunWeb.mainchain,
      );
      this.proxiedMethods.tronLinkSetSideAddress = sunWeb.sidechain.setAddress.bind(
        sunWeb.sidechain,
      );
    } else {
      this.proxiedMethods = {
        setAddress: tronWeb.setAddress.bind(tronWeb),
        setMainAddress: sunWeb.mainchain.setAddress.bind(sunWeb.mainchain),
        setSideAddress: sunWeb.sidechain.setAddress.bind(sunWeb.sidechain),
        sign: tronWeb.trx.sign.bind(tronWeb),
        multiSign: tronWeb.trx.multiSign.bind(tronWeb),
      };
    }

    ['setPrivateKey', 'setAddress', 'setFullNode', 'setSolidityNode', 'setEventServer'].forEach(
      (method) => {
        tronWeb[method] = disabledMethod;
        sunWeb.mainchain[method] = disabledMethod;
        sunWeb.sidechain[method] = disabledMethod;
      },
    );

    ['setMainGatewayAddress', 'setSideGatewayAddress', 'setChainId'].forEach((method) => {
      sunWeb[method] = () => disabledMethod;
    });

    tronWeb.trx.sign = (...args: any[]) => this.sign(...args);

    sunWeb.mainchain.trx.sign = (...args: any[]) => this.sign(...args);
    sunWeb.sidechain.trx.sign = (...args: any[]) => this.sign(...args);

    tronWeb.trx.multiSign = (...args: any[]) => this.multiSign(...args);

    sunWeb.mainchain.trx.multiSign = (...args: any[]) => this.multiSign(...args);

    sunWeb.sidechain.trx.multiSign = (...args: any) => this.multiSign(...args);

    tronWeb.setHeader = (...args: any) => this.setHeader(...args);

    tronWeb.request = (args: RequestArgs) => {
      return this.doRequest(args, tronWeb);
    };

    sunWeb.request = (args: RequestArgs) => {
      return this.doRequest(args, sunWeb);
    };

    tronLink.request = (args: RequestArgs) => {
      return this.doRequest(args, tronLink);
    };

    return { tronWeb, sunWeb, tronLink };
  }

  sign(
    transaction: any,
    privateKey: string | boolean = false,
    useTronHeader = true,
    callback: any = false,
  ) {
    if (Utils.isFunction(privateKey)) {
      callback = privateKey;
      privateKey = false;
    }

    if (Utils.isFunction(useTronHeader)) {
      callback = useTronHeader;
      useTronHeader = true;
    }

    if (!callback) {
      return injectPromise(this.sign.bind(this), transaction, privateKey, useTronHeader);
    }

    if (!window.tronWeb.ready) {
      return callback('User has not unlocked wallet');
    }

    if (privateKey) {
      return (
        this.proxiedMethods.sign &&
        this.proxiedMethods.sign(transaction, privateKey, useTronHeader, callback)
      );
    }
    if (!transaction) {
      return callback('Invalid transaction provided');
    }
    this.requestHandler
      .send('sign', {
        transaction,
        useTronHeader,
        input:
          typeof transaction === 'string'
            ? transaction
            : transaction.__payload__ || transaction.raw_data.contract[0].parameter.value,
      })
      .then((transaction) => {
        callback(null, transaction);
      })
      .catch((err) => {
        log.info('Failed to sign transaction:', err);
        callback(err);
      });
  }

  multiSign(
    transaction = false,
    privateKey = false,
    permissionId: number | boolean = false,
    callback: any = false,
  ) {
    if (Utils.isFunction(permissionId)) {
      callback = permissionId;
      permissionId = 0;
    }

    if (Utils.isFunction(privateKey)) {
      callback = privateKey;
      privateKey = false;
      permissionId = 0;
    }

    if (!callback)
      return injectPromise(this.multiSign.bind(this), transaction, privateKey, permissionId);

    if (!window.tronWeb.ready) {
      return callback('User has not unlocked wallet');
    }

    if (!Utils.isObject(transaction) || !transaction.raw_data || !transaction.raw_data.contract)
      return callback('Invalid transaction provided');

    if (privateKey) {
      return (
        this.proxiedMethods.multiSign &&
        this.proxiedMethods.multiSign(transaction, privateKey, permissionId, callback)
      );
    }

    this.requestHandler
      .send('multiSign', {
        transaction,
        useTronHeader: true,
        input: transaction.__payload__ || transaction.raw_data.contract[0].parameter.value,
        permissionId,
      })
      .then((transaction) => callback(null, transaction, permissionId))
      .catch((err) => {
        log.info('Failed to sign transaction:', err);
        callback(err);
      });
  }

  private async _initRequest(cb?: () => void) {
    try {
      const res = await this.requestHandler.send('init');
      // @ts-ignore
      const { address, node, name, type, phishingList, connectNode = false, isAuth } = res;
      this._initParams(address, node, name, type, phishingList, connectNode);

      if (isAuth && !window.tronLink.tronWeb) {
        const { tronWeb, sunWeb } = this._createTronWeb(true);
        window.tronLink.tronWeb = tronWeb;
        window.tronLink.sunWeb = sunWeb;
      }
      initTronWalletParams(
        address,
        node,
        name,
        type,
        phishingList,
        connectNode,
        isAuth,
        this.proxiedMethods,
      );
      window.dispatchEvent(new Event('tronLink#initialized'));
    } catch (err: any) {
      log.info('Failed to initialise TronWeb', err);
    }
    if (cb) {
      cb();
    }
  }

  private _initParams(
    address: string,
    node: any,
    name: string,
    type: 0 | 1 | 2,
    phishingList: PhishingListType,
    connectNode: any = false,
  ) {
    this.setAddress({ address, name, type });

    if (node.fullNode) {
      setNodeCommon({ node: node, connectNode: connectNode }, window.tronWeb, window.sunWeb);
    }

    log.info('TronLink initiated');

    if (phishingList) {
      const href = window.location.origin;
      const c = phishingList.find(({ url }) => {
        const reg = new RegExp(url);
        return href.match(reg);
      });
      if (c && !c.isVisit) {
        log.warn('Blocked by local phishing list:', href);
      }
    }
  }

  private setVisited(href: string) {
    this.requestHandler
      .send('setVisited', { href })
      .then((res) => res)
      .catch((err) => {
        log.info('Failed to set visit:', err);
      });
  }

  private doRequest(args: RequestArgs, provider: TronWeb) {
    if (args && 'tron_requestAccounts' === args.method) {
      args.params = Object.assign({}, args.params, provider.tronlinkParams);
    }
    log.debug('****** doRequest args', args.params);
    return this.requestHandler.send('request', args);
  }

  setAddress({ address, name, type }: { address: string; name: string; type: 0 | 1 | 2 }) {
    // logger.info('TronLink: New address configured');
    setPreAddress(address);
    if (!TronWeb.isAddress(address)) {
      disableDefaultAddress(window.tronWeb, window.sunWeb);
    } else {
      setIsDisable(false);
      this.proxiedMethods.setAddress?.(address);
      this.proxiedMethods.setMainAddress?.(address);
      this.proxiedMethods.setSideAddress?.(address);
      window.tronWeb.defaultAddress.name = name;
      window.tronWeb.defaultAddress.type = type;
      window.sunWeb.mainchain.defaultAddress.name = name;
      window.sunWeb.mainchain.defaultAddress.type = type;
      window.sunWeb.sidechain.defaultAddress.name = name;
      window.sunWeb.sidechain.defaultAddress.type = type;
      window.tronWeb.ready = true;
    }
  }

  private _connectWebsite(args: { origin: string; data: any }) {
    const { origin } = location;
    if (args && origin === args.origin) {
      const {
        tronWeb: newTronWeb,
        sunWeb: newSunWeb,
        tronLink: newTronLink,
      } = this._createTronWeb(true);
      // new
      if (window.tronLink) {
        window.tronLink.tronWeb = newTronWeb;
        window.tronLink.sunWeb = newSunWeb;
      } else {
        newTronLink.tronWeb = newTronWeb;
        newTronLink.sunWeb = newSunWeb;
        window.tronLink = newTronLink;
      }
      window.tronLink.ready = true;

      // old
      setIsDisable(false);
      window.tronWeb.ready = true;
      const { address, node, name, type, phishingList, connectNode = false, isAuth } = args.data;
      this._initParams(address, node, name, type, phishingList, connectNode);
      initTronWalletParams(
        address,
        node,
        name,
        type,
        phishingList,
        connectNode,
        isAuth,
        this.proxiedMethods,
      );

      // TODO: tricky, delay the disconnect message after tabReply
      setTimeout(() => {
        postMessageToUser('connect');
      }, 20);
    }
  }

  private async onAddressChange(
    args: { address: string; name: string; type: 0 | 1 | 2 } | undefined,
  ) {
    log.debug('****** onAddressChange', args);
    const preAddress = getPreAddress();
    let currentAddress: string | undefined = undefined;
    if (args) {
      currentAddress = args.address;
    }
    if (preAddress != currentAddress) {
      await this._initRequest(() => {
        postMessageToUser('accountsChanged', { address: currentAddress });
      });
    } else if (!getIsDisable() && args) {
      this.setAddress(args);
      if (window.tronLink.tronWeb) {
        setAddressTronWallet(
          args,
          window.tronLink.tronWeb,
          window.tronLink.sunWeb,
          this.proxiedMethods,
        );
      }
    }
  }

  setHeader(headers: any = {}) {
    window.tronWeb.fullNode.configure(window.tronWeb.fullNode.host, headers);
    window.tronWeb.solidityNode.configure(window.tronWeb.solidityNode.host, headers);
    window.tronWeb.eventServer.configure(window.tronWeb.eventServer.host, headers);
    window.sunWeb.mainchain.fullNode.configure(window.sunWeb.mainchain.fullNode.host, headers);
    window.sunWeb.mainchain.solidityNode.configure(
      window.sunWeb.mainchain.solidityNode.host,
      headers,
    );
    window.sunWeb.mainchain.eventServer.configure(
      window.sunWeb.mainchain.eventServer.host,
      headers,
    );

    window.tronLink.tronWeb.fullNode.configure(window.tronWeb.fullNode.host, headers);
    window.tronLink.tronWeb.solidityNode.configure(window.tronWeb.solidityNode.host, headers);
    window.tronLink.tronWeb.eventServer.configure(window.tronWeb.eventServer.host, headers);
    window.tronLink.sunWeb.mainchain.fullNode.configure(
      window.sunWeb.mainchain.fullNode.host,
      headers,
    );
    window.tronLink.sunWeb.mainchain.solidityNode.configure(
      window.sunWeb.mainchain.solidityNode.host,
      headers,
    );
    window.tronLink.sunWeb.mainchain.eventServer.configure(
      window.sunWeb.mainchain.eventServer.host,
      headers,
    );
  }
}

const injectedScript = new InjectedScript();
injectedScript.init().then();
