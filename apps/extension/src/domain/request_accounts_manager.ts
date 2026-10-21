import _ from 'lodash';
import log from 'loglevel';

import { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { getStore, RootState } from '../store/store';
import { getActiveTabs } from '../lib/extension/tab';
import { secondaryPopup } from './secondary_popup';
import {
  addConnectedWebsite,
  ConnectedWebsiteType,
  removeAddress,
  removeConnectedWebsite,
} from '../store/slices/connected_website';
import { getHostname } from '../lib/bg_msg/message_hub';
import PAGES from '../constants/pages';
import { sendNotifyEvent } from '../lib/notify_event';
import { accountManager } from './account_manager';
import { EVENT_DELETE_ADDRESS, eventBus } from './event_bus';
import { getOrigin } from '../lib/bg_msg/util';
import { getNodeList } from '../store/slices/node_management';
import { phishingListManager } from './phishing_list_manager';
import { signManager } from './sign_manager';
import { redirectPopupToPage, redirectSecondaryPopupToPage } from '../lib/popup';
import { updateCheckPendingInfos } from '../store/slices/notification';
import { OTHER_NODES_INFO } from '../constants/tron_nodes';
import { secondaryPopupManager } from './secondary_popup_manager';

interface PendingInfo extends ConnectedWebsiteType {
  uuid: string;
  meta: DuplexMessageMetaType;
  tabId: number;
}

interface ConnectWebsiteParamTyp {
  address: string;
  webInfo: ConnectedWebsiteType;
  isFromAuthPage?: boolean;
}

class RequestAccountsManager {
  static #instance: RequestAccountsManager;

  private locked: boolean;
  private timerForUnlock: number;
  private readonly pendingInfos: PendingInfo[];

  private constructor() {
    this.locked = false;
    this.timerForUnlock = 0;
    this.pendingInfos = [];
    this.registerEvents();
  }

  public static getInstance(): RequestAccountsManager {
    if (!RequestAccountsManager.#instance) {
      RequestAccountsManager.#instance = new RequestAccountsManager();
    }

    return RequestAccountsManager.#instance;
  }

  async requestAccounts(uuid: string, params: any, meta: DuplexMessageMetaType) {
    const origin = getOrigin(meta)!;

    if (this.isConnected(origin)) {
      meta.resolve({
        success: true,
        data: {
          code: 200,
          message: 'The site is already in the whitelist',
        },
        uuid,
      });
      return;
    }

    const tabs = await getActiveTabs();
    const tabId = meta.sender.tab?.id;

    const isActiveTab = _.findIndex(tabs, (ele) => tabId === ele.id) > -1;

    if (!isActiveTab) {
      meta.resolve({
        success: true,
        data: {
          code: 200,
          message: 'The site is not active tab, No treatment for now',
        },
        uuid,
      });
    }

    if (this.locked) {
      meta.resolve({
        success: true,
        data: '',
        uuid,
      });
      return;
    }

    this.lock();

    if (this.isProcessing(origin)) {
      const isPopupOpened = await secondaryPopup.isWindowOpened();

      if (isPopupOpened) {
        meta.resolve({
          success: true,
          data: {
            code: 4000,
            message: 'Authorization requests are being processed, please do not resubmit',
          },
          uuid,
        });
        return;
      }
    }

    // save pending info for confirm dialog
    const websiteIcon = params?.websiteIcon || _.get(meta.sender, 'tab.favIconUrl');
    const websiteName = params?.websiteName || _.get(meta.sender, 'title');
    const hostname = getHostname(meta.sender);

    const pendingInfo = {
      origin,
      hostname,
      websiteIcon,
      websiteName,
      uuid,
      tabId: tabId!,
      meta: meta,
    };

    this.queuePendingInfo(pendingInfo);

    await this.openRequestAccountsSecondaryPopup();
    log.debug('**** requestAccounts finished');
  }

  private lock() {
    this.locked = true;
    if (this.timerForUnlock) {
      clearTimeout(this.timerForUnlock);
    }
    // @ts-ignore
    this.timerForUnlock = setTimeout(() => {
      this.locked = false;
    }, 100);
  }

  pendingWebsiteInfo() {
    const pendingInfo = this.pendingInfos[0];
    if (!pendingInfo) {
      throw Error('no pending info');
    }
    return {
      hostname: pendingInfo.hostname,
      origin: pendingInfo.origin,
      websiteName: pendingInfo.websiteName,
      websiteIcon: pendingInfo.websiteIcon,
    };
  }

  public async approveConnect() {
    const pendingInfo = this.pendingInfos[0];
    if (!pendingInfo) {
      await secondaryPopup.close();
      await redirectPopupToPage(PAGES.PAGE_HOMEPAGE);
      return;
    }

    try {
      await this.connectWebsite({
        address: accountManager.getSelectedAddress(),
        webInfo: this.pendingWebsiteInfo(),
        isFromAuthPage: true,
      });
      pendingInfo.meta.resolve({
        success: true,
        data: {
          code: 200,
          message: 'User allowed the request.',
        },
        uuid: pendingInfo.uuid,
      });
    } catch (e) {
      log.error('approveConnect', e);
    } finally {
      await this.cleanUp();
    }
  }

  public async openRequestAccountsSecondaryPopup() {
    await secondaryPopup.open(`secondary_popup/secondary_popup.html#${PAGES.PAGE_CONNECT_WEBSITE}`);
    await redirectSecondaryPopupToPage(PAGES.PAGE_CONNECT_WEBSITE);
    await redirectPopupToPage(PAGES.PAGE_CONNECT_WEBSITE);
    getStore().dispatch(updateCheckPendingInfos());
  }

  public async connectWebsite({ address, webInfo, isFromAuthPage }: ConnectWebsiteParamTyp) {
    getStore().dispatch(addConnectedWebsite({ address, website: webInfo }));

    interface Params extends ConnectedWebsiteType {
      isFromAuthPage?: boolean;
      data: any;
    }

    const data = await this.makeConnectData(webInfo.origin);
    const params: Params = Object.assign({ isFromAuthPage, data }, webInfo);
    if (isFromAuthPage) {
      await sendNotifyEvent('acceptWeb', params, webInfo.origin);
    } else {
      await sendNotifyEvent('connectWeb', params, webInfo.origin);
    }
  }

  public async rejectConnect() {
    const pendingInfo = this.pendingInfos[0];
    if (!pendingInfo) {
      await secondaryPopup.close();
      await redirectPopupToPage(PAGES.PAGE_HOMEPAGE);
      return;
    }

    try {
      await this.disconnectWebsite({
        address: accountManager.getSelectedAddress(),
        webInfo: Object.assign({ isFromAuthPage: true }, this.pendingWebsiteInfo()),
        isFromAuthPage: true,
      });
      pendingInfo.meta.resolve({
        success: true,
        data: {
          code: 4001,
          message: 'User rejected the request.',
        },
        uuid: pendingInfo.uuid,
      });
      await signManager.rejectConfirmationsBy(pendingInfo.origin);
    } catch (e) {
      log.error('rejectConnect', e);
    } finally {
      await this.cleanUp();
    }
  }

  public isConnected(origin: string) {
    const rootState: RootState = getStore().getState();
    const address = rootState.addressInfo.selectedAddress;
    const connectedWebsites = rootState.connectedWebsiteInfo[address] || [];

    const res =
      _.findIndex(connectedWebsites, (ele) => ele.origin == origin) > -1 ||
      _.findIndex(sysWhiteList, (ele) => ele.origin == origin) > -1;
    return res;
  }

  public async disconnectWebsite({ address, webInfo, isFromAuthPage }: ConnectWebsiteParamTyp) {
    getStore().dispatch(removeConnectedWebsite({ address, origin: webInfo.origin }));
    if (isFromAuthPage) {
      await sendNotifyEvent('rejectWeb', webInfo, webInfo.origin);
    } else {
      await sendNotifyEvent('disconnectWeb', webInfo, webInfo.origin);
    }
  }

  private async cleanUp() {
    this.pendingInfos.shift();
    this.locked = false;
    await secondaryPopupManager.centralControl();
  }

  private registerEvents() {
    eventBus.on(EVENT_DELETE_ADDRESS, (params) => {
      const { address } = params;
      getStore().dispatch(removeAddress(address));
    });
  }

  public async makeConnectData(origin: string) {
    const response = {
      address: false,
      node: {
        fullNode: false,
        solidityNode: false,
        eventServer: false,
      },
      connectNode: false,
      name: false,
      type: false,
      isAuth: false,
    };

    if (accountManager.isLocked()) {
      return response;
    }

    Object.assign(response, this.getNodeInfo());

    const { selectedAddressItem, selectedAccount } = await accountManager.getSelected();
    // @ts-ignore
    response.address = selectedAddressItem.address;
    // @ts-ignore
    response.name = selectedAddressItem.name;
    // @ts-ignore
    response.type = accountManager.getAccountType(selectedAccount);
    // @ts-ignore
    response.phishingList = phishingListManager.phishingList;
    response.isAuth = this.isConnected(origin);

    return response;
  }

  public getNodeInfo() {
    const rootState: RootState = getStore().getState();
    const selectedNode = rootState.nodeManagement.selectedNode;
    const nodes = getNodeList(rootState);
    const NODE_OMIT_KEYS = ['isCanDelete', 'apiConfig', 'formatTip'];
    // @ts-ignore
    const node = _.omit(nodes[selectedNode], NODE_OMIT_KEYS);
    const res: { node: any; connectNode?: any } = { node };
    // @ts-ignore
    if (node.connect) {
      // @ts-ignore
      let connectNode = nodes[node.connect];
      if (!connectNode) {
        // @ts-ignore
        connectNode = OTHER_NODES_INFO[node.connect];
      }
      // @ts-ignore
      res.connectNode = _.omit(connectNode, NODE_OMIT_KEYS);
    }
    return res;
  }

  public isProcessing(origin: string) {
    return this.pendingInfos.findIndex((ele) => ele.origin == origin) > -1;
  }

  private queuePendingInfo(pendingInfo: PendingInfo) {
    if (this.isProcessing(pendingInfo.origin)) {
      return;
    }
    this.pendingInfos.unshift(pendingInfo);
  }

  public existPendingInfos() {
    return this.pendingInfos.length > 0;
  }
}

export const sysWhiteList: ConnectedWebsiteType[] = [
  {
    origin: 'https://tronscan.org',
    hostname: 'tronscan.org',
    websiteIcon: 'https://tronscan.org/favicon.png?v=1',
    websiteName: 'TRON',
    isSysWhiteWebSite: true,
  },
  {
    origin: 'https://tronscan.io',
    hostname: 'tronscan.io',
    websiteIcon: 'https://tronscan.io/favicon.png?v=1',
    websiteName: 'TRON',
    isSysWhiteWebSite: true,
  },
  {
    origin: 'https://nile.tronscan.org',
    hostname: 'nile.tronscan.org',
    websiteIcon: 'https://nile.tronscan.org/favicon.png?v=1',
    websiteName: 'TRON',
    isSysWhiteWebSite: true,
  },
  {
    origin: 'https://shasta.tronscan.org',
    hostname: 'shasta.tronscan.org',
    websiteIcon: 'https://shasta.tronscan.org/favicon.png?v=1',
    websiteName: 'TRON',
    isSysWhiteWebSite: true,
  },
];

export const requestAccountsManager = RequestAccountsManager.getInstance();
