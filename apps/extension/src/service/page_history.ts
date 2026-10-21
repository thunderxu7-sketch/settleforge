import { NavigateFunction, useNavigate } from 'react-router';
import { chromeStorage } from '../lib/storage';
import PAGES from '../constants/pages';

interface PageInfo {
  page: PAGES;
  params?: any;
}

let historyArray: PageInfo[] = [];
let navigate: NavigateFunction;

class PageHistory {
  private static save() {
    chromeStorage.setItem('historyArray', historyArray);
  }

  public static async init(_navigate: NavigateFunction) {
    historyArray = (await chromeStorage.getItem('historyArray')) as PageInfo[];
    navigate = _navigate;
    if (!historyArray) {
      historyArray = [];
    }
    return historyArray;
  }

  public static getList() {
    return historyArray;
  }

  public static record(page: PAGES, params?: any) {
    const final = historyArray.length - 1;
    if (historyArray.length && historyArray[final].page === page) return;
    historyArray.push({ page: page, params });
  }

  public static async go(target: PAGES | number, params?: any) {
    let targetPageInfo: PageInfo;
    if (typeof target === 'number') {
      if (target >= 0) throw new Error('unexpected: number greater than 0');
      const backPageNum = 0 - target;
      if (historyArray.length < backPageNum)
        throw new Error('unexpected: number greater than historyArray length');
      let index = backPageNum;
      while (index > 0) {
        index--;
        historyArray.pop();
      }
      const final = historyArray.length - 1;
      targetPageInfo = historyArray[final];
      navigate(targetPageInfo!.page, { state: params || targetPageInfo!.params });
    } else if (Object.values(PAGES).includes(target)) {
      targetPageInfo = { page: target, params };
      PageHistory.record(targetPageInfo.page, targetPageInfo.params);
      navigate(target, { state: params });
    }
    PageHistory.save();
  }
}

export default PageHistory;
