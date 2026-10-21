import { chromeStorage } from '../lib/storage';
import { SEARCH_HISTORY } from '../constants/storage_keys';

interface HistorySearchType {
  id?: string;
  url?: string;
  shortName?: string;
  keyWord: string;
}

export async function afterInputChange(searchInfo: HistorySearchType) {
  let searchList: Array<HistorySearchType> = [];
  const res: Array<HistorySearchType> = await getHistorySearch();
  if (res?.length > 0) searchList = res;
  let searchRes: Array<boolean> = [];
  if (searchList?.length > 0) {
    searchRes = searchList.map((item) => item?.keyWord === searchInfo?.keyWord);
  }
  searchRes.map((item, index) => item === true && searchList.splice(index, 1));
  searchList.unshift(searchInfo);
  if (searchList.length > 10) searchList.length = 10;
  updateHistorySearch(searchList);
  return searchList;
}

export async function getHistorySearch() {
  const res: Array<HistorySearchType> = await chromeStorage.getItem(SEARCH_HISTORY);
  return res;
}

export async function updateHistorySearch(searchHistoryList: Array<HistorySearchType>) {
  await chromeStorage.setItem(SEARCH_HISTORY, searchHistoryList);
}

export async function clearHistorySearch() {
  await chromeStorage.setItem(SEARCH_HISTORY, []);
}
