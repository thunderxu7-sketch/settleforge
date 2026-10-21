import { getWebsiteBlacklist, ApiResponse } from '../service/local_data_service';
import { getStore, RootState } from '../store/store';

class PhishingListManager {
  static #instance: PhishingListManager;
  phishingList: any[];

  private constructor() {
    // ignore
    this.phishingList = [];
  }

  public static getInstance(): PhishingListManager {
    if (!PhishingListManager.#instance) {
      PhishingListManager.#instance = new PhishingListManager();
    }

    return PhishingListManager.#instance;
  }

  async updateFromLocalData() {
    try {
      const rootState: RootState = getStore().getState();
      const selectedAddress = rootState.addressInfo.selectedAddress;

      const { success, data } = (await getWebsiteBlacklist(selectedAddress)) as ApiResponse;
      if (success) {
        this.phishingList = data.map((ele: string) => ({ url: ele, isVisit: false }));
      }
    } catch (e: any) {
      // ignore
    }
  }

  setVisited(href: string) {
    if (href) {
      this.phishingList = this.phishingList.map(({ url, isVisit }) => {
        const reg = new RegExp(url);
        if (href.match(reg)) {
          isVisit = true;
        }
        return { url, isVisit };
      });
    } else {
      this.phishingList = this.phishingList.map(({ url, isVisit }) => {
        isVisit = false;
        return { url, isVisit };
      });
    }
  }
}

export const phishingListManager = PhishingListManager.getInstance();
