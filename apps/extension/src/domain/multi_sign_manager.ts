import _ from 'lodash';

import { getMultiTrxRecord } from '../service/local_data_service';
import { getStore, RootState } from '../store/store';
import { MultiSignTransactions, updateForAddress } from '../store/slices/multi_sign';
import { EVENT_DELETE_ADDRESS, eventBus } from './event_bus';
import { removeAddress } from '../store/slices/multi_sign';

class MultiSignManager {
  static #instance: MultiSignManager;

  private constructor() {
    this.registerEvents();
  }

  public static getInstance(): MultiSignManager {
    if (!MultiSignManager.#instance) {
      MultiSignManager.#instance = new MultiSignManager();
    }

    return MultiSignManager.#instance;
  }

  async fetchMultiSignRecords(): Promise<void> {
    const rootState: RootState = getStore().getState();
    const selectedAddress = rootState.addressInfo.selectedAddress;

    if (!selectedAddress) {
      return;
    }

    try {
      const res = await getMultiTrxRecord(selectedAddress);
      const success = _.get(res, 'success', false);

      if (success) {
        const data = _.get(res, 'data.data', []);
        let transactions: MultiSignTransactions = {};
        if (data.length !== 0) {
          transactions = _.cloneDeep(rootState.multiSignInfo[selectedAddress]) || {};

          data.forEach((item: any) => {
            if (Number(item.isSign) === 0) {
              if (transactions[item.hash] === undefined) {
                transactions[item.hash] = { status: true };
              }
            } else if (Number(item.isSign) === 1) {
              transactions[item.hash] = { status: false };
            }
          });
        }

        getStore().dispatch(
          updateForAddress({
            [selectedAddress]: transactions,
          }),
        );
      }
    } catch (err: any) {
      // ignore
    }
  }

  setMultiSignViewed() {
    const rootState: RootState = getStore().getState();
    const selectedAddress = rootState.addressInfo.selectedAddress;
    const transactions = _.cloneDeep(rootState.multiSignInfo[selectedAddress]) || {};
    Object.values(transactions).forEach((item) => {
      item.status = false;
    });
    getStore().dispatch(
      updateForAddress({
        [selectedAddress]: transactions,
      }),
    );
  }

  private registerEvents() {
    eventBus.on(EVENT_DELETE_ADDRESS, (params) => {
      const { address } = params;
      getStore().dispatch(removeAddress(address));
    });
  }
}

export const multiSignManager = MultiSignManager.getInstance();
