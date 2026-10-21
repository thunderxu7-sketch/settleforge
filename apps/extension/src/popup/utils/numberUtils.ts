import bigNumber, { BigNumber as BigNumberNS } from 'bignumber.js';

export type BigNumberValue = BigNumberNS.Value;

bigNumber.config({ EXPONENTIAL_AT: 1e9 });

// @ts-ignore
bigNumber.prototype._toFixed = function (...arg) {
  // @ts-ignore
  return new bigNumber(this).isNaN() ? '0' : new bigNumber(this.toFixed(...arg)).toString();
};
// @ts-ignore
bigNumber.prototype._toFixedNew = function (...arg) {
  // @ts-ignore
  return new bigNumber(this.toFixed(...arg)).toString();
};
// @ts-ignore
bigNumber.prototype._toBg = function () {
  return this;
};
// @ts-ignore
bigNumber.prototype._toHex = function () {
  return `0x${this.toString(16)}`;
};
// @ts-ignore
bigNumber.prototype._toIntegerDown = function () {
  return new bigNumber(this).isNaN()
    ? '0'
    : new bigNumber(this).integerValue(bigNumber.ROUND_DOWN || 1);
};

export const BigNumber = bigNumber;

export const formatNumber = (
  num: bigNumber.Value | bigNumber,
  {
    dp = 3,
    rm = 1,
    percent = false,
    miniText = false,
    needDollar = false,
    keepPositive = false,
    miniTextNoZero = false,
    separator = true,
    cutZero = false,
  }: any = {},
) => {
  if (num === '--' || new BigNumber(num).isNaN()) return '--';
  if (keepPositive && new BigNumber(num).lt(0)) return '--';
  num = new BigNumber(num);
  if (miniText && num.lt(miniText) && (!num.eq(0) || miniTextNoZero)) {
    return `< ${needDollar ? '$' : ''}${miniText}`;
  }

  if (percent && num.gte(100)) {
    num = new BigNumber(100);
  }

  let result = `${needDollar ? '$' : ''}${num.toFormat(Number(dp), rm)}`;
  if (!separator) {
    result = result.replace(/,/g, '');
  }

  if (cutZero) {
    const parts = result.toString().split('.');
    parts[1] = parts[1] ? parts[1].replace(/0+?$/, '') : '';
    result = parts[0] + (parts[1] ? `.${parts[1]}` : '');
  }
  return result;
};

export const formatWithSpt = (account: string | number) => {
  return (
    account &&
    account.toString().replace(/\d+/, function (s) {
      return s.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    })
  );
};

export const formatTitleBalance = (balance: string | number | BigNumberValue) => {
  const balanceBN = new BigNumber(balance);
  if (balanceBN.gt(1e12)) {
    return formatWithSpt(formatNumber(balanceBN, { dp: 0 }));
  } else if (balanceBN.gt(1e11)) {
    return formatWithSpt(formatNumber(balanceBN, { dp: 1, cutZero: true }));
  } else if (balanceBN.gt(1e10)) {
    return formatWithSpt(formatNumber(balanceBN, { dp: 2, cutZero: true }));
  } else {
    return formatWithSpt(formatNumber(balanceBN, { dp: 3, cutZero: true }));
  }
};

export const numberParser = (str: string, decimal: number) => {
  if (!str) return { valid: true, str: '' };
  let reg = new RegExp(`^(\\d+)(\\.\\d*)?$`);
  if (decimal !== undefined) {
    reg = new RegExp(`^(\\d+)(\\.\\d{0,${decimal}})?$`);
  }

  if (!reg.test(str)) {
    return { valid: false, str: '' };
  } else {
    return { valid: true, str: str.replace(/^0+(\d)/g, '$1') };
  }
};

export const _toFormat = function (value: any) {
  if (typeof value === 'string') {
    value = value.replace(/,/g, '');
    const arr = value.split('.');
    const formatStr = new BigNumber(arr[0]).toFormat();
    if (formatStr === 'NaN') {
      return '';
    }

    if (arr[1] !== undefined) {
      return `${formatStr}.${arr[1]}`;
    }
    return formatStr;
  }
  const formatStr = new BigNumber(value).toFormat();
  if (formatStr === 'NaN') {
    return '';
  }

  return formatStr;
};

export const bigFormat = (
  num: string | number,
  dp = 0,
  cutZero = true,
  miniText = false,
  needDollar = false,
  separator = false,
) => {
  const bNum = new BigNumber(num);
  if (bNum.gte(1e13)) {
    return formatNumber(bNum.div(1e12), { dp, cutZero, miniText, needDollar, separator }) + 'T';
  } else if (bNum.gte(1e10)) {
    return formatNumber(bNum.div(1e9), { dp, cutZero, miniText, needDollar, separator }) + 'B';
  } else if (bNum.gte(1e7)) {
    return formatNumber(bNum.div(1e6), { dp, cutZero, miniText, needDollar, separator }) + 'M';
  } else if (bNum.gte(1e4)) {
    return formatNumber(bNum.div(1e3), { dp, cutZero, miniText, needDollar, separator }) + 'K';
  }
  return formatNumber(bNum, { dp, cutZero, miniText, needDollar, separator });
};

export const formatFloat = (num: number, pos: number) => {
  return Math.round(num * Math.pow(10, pos)) / Math.pow(10, pos);
};
