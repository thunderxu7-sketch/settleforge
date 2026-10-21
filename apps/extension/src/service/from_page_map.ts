/**
 * Use a map to record the fallback corresponding to each page
 * When the page forward path is: A -> B -> C -> D
 * Can go back continuously from page D to C, B, A
 * You can't do this with a single fromPage variable
 */

import { chromeStorage } from '../lib/storage';
import PAGES from '../constants/pages';

interface FromPageInfo {
  page: PAGES;
  params?: any;
}

let fromPageObj: Record<PAGES | string, FromPageInfo> = {};

class FromPageMap {
  public static async init() {
    const fromPageStr = (await chromeStorage.getItem('fromPage')) as string;
    try {
      fromPageObj = JSON.parse(fromPageStr);
    } catch (e: any) {
      console.error('FromPageMap function error', e);
    }
    if (!fromPageObj) fromPageObj = {};
    return fromPageObj;
  }

  public static getList() {
    return fromPageObj;
  }

  // TODO: remove fromPageParams, params of page should save in a alone storage object
  public static get(key: PAGES): { fromPage: PAGES; fromPageParams: any } {
    if (!fromPageObj[key]) throw new Error('cannot get invalid PAGES');
    return { fromPage: fromPageObj[key].page, fromPageParams: fromPageObj[key].params };
  }

  public static set(key: PAGES, { page, params }: FromPageInfo) {
    fromPageObj[key] = { page, params };
    chromeStorage.setItem('fromPage', JSON.stringify(fromPageObj));
  }
}

export default FromPageMap;
