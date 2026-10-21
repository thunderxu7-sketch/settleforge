import _ from 'lodash';
import log from 'loglevel';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, getStore } from '../store';
import {
  NODE_ID_MAIN,
  NODE_ID_TRONSTACK,
  NODE_ID_SHASTA,
  NODE_ID_NILE,
  NODE_ID_MAIN_DAPP_CHAIN,
  NODE_ID_TEST_DAPP_CHAIN,
} from '../../constants/tron_nodes';

export interface TransferRecordItemState {
  fromAddress: string;
  toAddress: string;
  precision: number;
  amount: string;
  tokenId: string;
  txId: string;
  timestamp: number;
  local: boolean;
  assetId?: string;
}

// distinguish by node and address
interface TransferRecordNodeState {
  [k: string]: TransferRecordItemState[];
}
export interface TransferRecordState {
  [k: string]: TransferRecordNodeState;
}

const initialState: TransferRecordState = {
  [NODE_ID_MAIN]: {},
  [NODE_ID_TRONSTACK]: {},
  [NODE_ID_SHASTA]: {},
  [NODE_ID_NILE]: {},
  [NODE_ID_MAIN_DAPP_CHAIN]: {},
  [NODE_ID_TEST_DAPP_CHAIN]: {},
};

export const transferRecordSlice = createSlice({
  name: 'transferRecord',
  initialState,
  reducers: {
    updateTransferRecord: (state, action: PayloadAction<TransferRecordItemState>) => {
      try {
        const transferRecord = action.payload;
        const { fromAddress } = transferRecord;
        const selectedNode = getStore().getState().nodeManagement.selectedNode;

        let selectedTransferRecord: TransferRecordItemState[] = [];
        if (state[selectedNode]) {
          selectedTransferRecord = state[selectedNode][fromAddress] ?? [];
        } else {
          state[selectedNode] = {};
        }

        selectedTransferRecord = _.filter(
          selectedTransferRecord,
          (item: TransferRecordItemState) => item.toAddress !== transferRecord.toAddress,
        );
        selectedTransferRecord.unshift(transferRecord);

        // max length 10 each node and address
        if (selectedTransferRecord.length > 10) {
          selectedTransferRecord.pop();
        }

        state[selectedNode][fromAddress] = selectedTransferRecord;
      } catch (error) {
        log.info('updateTransferRecord error: ', error);
      }
    },
    deleteTransferRecordsByAddress: (state, action: PayloadAction<string>) => {
      const address = action.payload;
      for (let nodeId in state) {
        delete state[nodeId][address];
      }
    },
    deleteTransferRecordsByNodeId: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      delete state[nodeId];
    },
  },
});

export const {
  updateTransferRecord,
  deleteTransferRecordsByAddress,
  deleteTransferRecordsByNodeId,
} = transferRecordSlice.actions;

export const selectTransferRecord = (state: RootState) => state.transferRecord;

export default transferRecordSlice.reducer;
