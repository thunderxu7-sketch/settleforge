import { useAppSelector } from '../store/hooks';

import { selectPrices } from '../store/slices/prices';
import { selectCurrency } from '../store/slices/settings';

export type PricesType = {
  priceList: { CNY: string; USD: string };
  selected: 'USD' | 'CNY';
  symbol: '$' | '¥';
};

export const usePricesInfo = () => {
  const selectedCurrency = useAppSelector(selectCurrency);
  const prices = useAppSelector(selectPrices);
  // @ts-ignore
  const pricesInfo: PricesType = {
    ...prices,
    selected: selectedCurrency,
    symbol: selectedCurrency === 'USD' ? '$' : '¥',
  };
  return {
    pricesInfo,
  };
};
