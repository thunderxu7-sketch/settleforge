import { formatNumber, BigNumber } from './numberUtils';

// const BNAmount = BigNumber.clone({ DECIMAL_PLACES: 6, ROUNDING_MODE: 1 });
// const BNWorth = BigNumber.clone({ DECIMAL_PLACES: 3, ROUNDING_MODE: 1 });

export const tokenAmountAndWorth = (
  price = 0,
  amount = new BigNumber(0),
  prices: any,
  trxCount = new BigNumber(0),
  { amountDecimal = 6 } = {},
) => {
  const limitAmount = '0.000001';
  const limitWorth = '0.001';
  let amountStr, moneyStr;
  amount = new BigNumber(amount);
  try {
    const money = new BigNumber(trxCount).times(prices.priceList[prices.selected]);

    if (amount.gte(limitAmount) || amount.eq(0)) {
      amountStr = formatNumber(amount, { dp: amountDecimal, cutZero: true });
    } else {
      amountStr = `< ${limitAmount}`;
    }
    if (money.eq(0)) {
      moneyStr = +price === 0 ? '--' : `≈ ${prices.symbol} 0`;
    } else if (money.gte(limitWorth)) {
      moneyStr = `≈ ${prices.symbol} ${formatNumber(money, { dp: 3, cutZero: true })}`;
    } else {
      moneyStr = `< ${prices.symbol} ${limitWorth}`;
    }

    return {
      amountStr,
      moneyStr,
    };
  } catch (e) {
    if (amount.gte(limitAmount) || amount.eq(0)) {
      amountStr = new BigNumber(new BigNumber(amount).toFixed()).toFormat();
    } else {
      amountStr = `< ${limitAmount}`;
    }
    return {
      amountStr,
      moneyStr: '--',
    };
  }
};
