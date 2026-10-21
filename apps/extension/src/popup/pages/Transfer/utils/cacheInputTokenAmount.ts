import { AssetItemType } from '../../../../constants/types';

interface CacheTransferDataState {
  inputAmount: number;
  inputToken: AssetItemType | {};
}

let cacheTransferData = {
  inputAmount: 0,
  inputToken: {},
};

export function getCacheTransferData() {
  return cacheTransferData;
}
export function setCacheTransferData(obj: CacheTransferDataState) {
  cacheTransferData = obj;
}
