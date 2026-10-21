// @ts-ignore
import TronWeb from 'tronweb';

import httpProxy from '../lib/httpProxy';
import type { RootState } from '../store/store';
import { getStore } from '../store/store';
import { TRON_NODES } from '../constants/tron_nodes';

class ReadOnlyTronWebManager {
  static #instance: ReadOnlyTronWebManager;
  #tronWeb: any;

  public static getInstance(): ReadOnlyTronWebManager {
    if (!ReadOnlyTronWebManager.#instance) {
      ReadOnlyTronWebManager.#instance = new ReadOnlyTronWebManager();
    }

    return ReadOnlyTronWebManager.#instance;
  }

  getTronWeb() {
    if (!this.#tronWeb) {
      const { fullNode, solidityNode, eventServer } = this.getSelectedNodeInfo();
      this.#tronWeb = new TronWeb(
        new httpProxy(fullNode),
        new httpProxy(solidityNode),
        new httpProxy(eventServer),
      );
    }
    return this.#tronWeb;
  }

  private getSelectedNodeInfo() {
    const rootState: RootState = getStore().getState();
    const nodeList: any = { ...TRON_NODES, ...rootState.nodeManagement.nodeList };
    const selectedNode = rootState.nodeManagement.selectedNode;
    return nodeList[selectedNode];
  }
}

export const readonlyTronWebManager = ReadOnlyTronWebManager.getInstance();
