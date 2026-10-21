import { EVENT_DELETE_ADDRESS, EVENT_DELETE_NODE, eventBus } from './event_bus';
import { getStore } from '../store/store';
import {
  deleteTransferRecordsByAddress,
  deleteTransferRecordsByNodeId,
} from '../store/slices/transfer_record';

class TransferRecordManager {
  static #instance: TransferRecordManager;

  private constructor() {}

  public init() {
    this.registerEvents();
  }

  public static getInstance(): TransferRecordManager {
    if (!TransferRecordManager.#instance) {
      TransferRecordManager.#instance = new TransferRecordManager();
    }

    return TransferRecordManager.#instance;
  }

  private registerEvents() {
    eventBus.on(EVENT_DELETE_ADDRESS, (params) => {
      const { address } = params;
      getStore().dispatch(deleteTransferRecordsByAddress(address));
    });

    eventBus.on(EVENT_DELETE_NODE, (params) => {
      const { nodeId } = params;
      getStore().dispatch(deleteTransferRecordsByNodeId(nodeId));
    });
  }
}

export const transferRecordManager = TransferRecordManager.getInstance();
