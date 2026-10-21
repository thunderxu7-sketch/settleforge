// @ts-ignore
import TronWeb from 'tronweb';
import httpProxy from '../lib/httpProxy';
import _ from 'lodash';
import log from 'loglevel';

import { accountManager } from '../domain/account_manager';
import type { RootState } from '../store/store';
import { getStore } from '../store/store';
import { TRON_NODES } from '../constants/tron_nodes';

class TronWebManager {
  static #instance: TronWebManager;
  public tronWeb: any;

  public static getInstance(): TronWebManager {
    if (!TronWebManager.#instance) {
      TronWebManager.#instance = new TronWebManager();
    }

    return TronWebManager.#instance;
  }

  async init() {
    try {
      const { fullNode, solidityNode, eventServer } = this.getSelectedNodeInfo();
      const userAddress = await accountManager.getSelectedAddress();
      const privateKey = await accountManager.getPrivateKey(userAddress);
      if (privateKey) {
        this.tronWeb = new TronWeb(
          new httpProxy(fullNode),
          new httpProxy(solidityNode),
          new httpProxy(eventServer),
          privateKey,
        );
      } else {
        this.tronWeb = new TronWeb(
          new httpProxy(fullNode),
          new httpProxy(solidityNode),
          new httpProxy(eventServer),
        );
        this.tronWeb.setAddress(userAddress);
      }
    } catch (e) {
      log.error('getTronWeb: ', e);
      this.tronWeb = false;
    }
  }

  async getTronWeb(userAddress: false | string = false) {
    try {
      const { fullNode, solidityNode, eventServer } = this.getSelectedNodeInfo();
      const privateKey = await accountManager.getPrivateKey(userAddress);
      if (privateKey) {
        this.tronWeb = new TronWeb(
          new httpProxy(fullNode),
          new httpProxy(solidityNode),
          new httpProxy(eventServer),
          privateKey,
        );
      } else {
        this.tronWeb = false;
      }
    } catch (e) {
      log.error('getTronWeb: ', e);
      this.tronWeb = false;
    }
  }

  getSelectedNodeInfo() {
    const rootState: RootState = getStore().getState();
    const nodeList: any = { ...TRON_NODES, ...rootState.nodeManagement.nodeList };
    const selectedNode = rootState.nodeManagement.selectedNode;
    return nodeList[selectedNode];
  }
}

export const tronWebManager = TronWebManager.getInstance();
