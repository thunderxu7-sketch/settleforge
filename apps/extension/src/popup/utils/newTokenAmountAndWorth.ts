import { formatNumber, BigNumber } from './numberUtils';

export const newTokenAmountAndWorth = (
  price = 0,
  amount = new BigNumber(0),
  prices: any,
  usdCount = 0,
  cnyCount = 0,
  { amountDecimal = 6 } = {},
) => {
  const limitAmount = '0.000001';
  const limitWorth = '0.001';
  let money, amountStr, moneyStr;
  amount = new BigNumber(amount);
  try {
    if (amount.gte(limitAmount) || amount.eq(0)) {
      amountStr = formatNumber(amount, { dp: amountDecimal, cutZero: true });
    } else {
      amountStr = `< ${limitAmount}`;
    }

    if (prices.selected === 'CNY') {
      money = new BigNumber(cnyCount);
    } else {
      money = new BigNumber(usdCount);
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
