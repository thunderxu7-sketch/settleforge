import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

import { TRON_NODES, DEFAULT_SELECTED_NODE, DEFAULT_NODE_IDS } from '../../constants/tron_nodes';
import { v4 as uuidV4 } from 'uuid';
import _ from 'lodash';
export interface HeadersType {
  [propName: string]: string;
}

export interface ConnectChainType {
  fullNode: string;
  solidityNode: string;
  eventServer: string;
  mainGateway?: string;
  sideGateway?: string;
  chainId: string;
}

export interface NodeListItemType {
  name?: string;
  formatName?: string;
  fullNode: string;
  solidityNode: string;
  eventServer: string;
  default: boolean;
  isCanDelete?: boolean;
  chain: string;
  connect: string;
  chainType: 0 | 1; // 0: Tron; 1: DappChain
  netType: 0 | 1;
  headers: HeadersType;
  connectChain: ConnectChainType;
  apiConfig: {
    [key: string]: any;
  };
  hostname?: string;
  freezeUrl?: string;
  multiSignUrl?: string;
  accountUrl?: string;
  voteUrl?: string;
}
interface NodeManagementState {
  nodeList: {
    [propName: string]: NodeListItemType;
  };
  selectedNode: string;
  nodeIds: Array<string>;
}

const initialState: NodeManagementState = {
  nodeList: {},
  selectedNode: DEFAULT_SELECTED_NODE,
  nodeIds: DEFAULT_NODE_IDS,
};

export const nodeManagementSlice = createSlice({
  name: 'nodeManagement',
  initialState,
  reducers: {
    deleteNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      delete state.nodeList[nodeId];
      _.remove(state.nodeIds, (v) => {
        return v === nodeId;
      });
      if (nodeId == state.selectedNode) {
        state.selectedNode = DEFAULT_SELECTED_NODE;
      }
    },
    addNode: (state, action: PayloadAction<any>) => {
      const nodeId = uuidV4();
      state.nodeList[nodeId] = action.payload;
      state.nodeIds.push(nodeId);
    },
    updateSelectedNode: (state, action: PayloadAction<string>) => {
      state.selectedNode = action.payload;
    },
  },
});

export const { deleteNode, addNode, updateSelectedNode } = nodeManagementSlice.actions;

export const getNodeList = (state: RootState) => {
  return { ...TRON_NODES, ...state.nodeManagement.nodeList };
};
export const getSelectedNode = (state: RootState) => state.nodeManagement.selectedNode;

export const getNodeIds = (state: RootState) => state.nodeManagement.nodeIds;

export default nodeManagementSlice.reducer;
