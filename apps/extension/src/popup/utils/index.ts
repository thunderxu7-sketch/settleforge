import log from 'loglevel';
import { safeEscape } from './escape';

export const delay = (timeout: number | undefined) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

export const cutMiddle = (text = '', left = 6, right = 6, { cutRed = false } = {}) => {
  try {
    if (text?.length <= left + right) {
      return text;
    }
    if (cutRed) {
      let leftText = text.split('<span class="redKey">')[0];
      const partRight = text.split('<span class="redKey">')[1];
      const splitRed = partRight ? partRight.split('</span>')[0] : '';
      const splitRight = partRight ? partRight.split('</span>')[1] : '';
      const redText = splitRed ? splitRed : '';
      let rightText = splitRight ? splitRight : '';
      if (leftText?.length < left) {
        const lastInfo = rightText.slice(rightText.length - right, rightText.length);
        if (leftText.length + redText.length <= left) {
          rightText =
            rightText.slice(0, left - redText.length - leftText.length) + '...' + lastInfo;
          leftText = leftText + `<span class="redKey">${redText}</span>`;
        } else {
          leftText =
            leftText + `<span class="redKey">${redText.slice(0, left - leftText.length)}...</span>`;
          if (lastInfo.length == right) {
            rightText = lastInfo;
          } else if (rightText.length + redText.length <= left) {
            rightText = `<span class="redKey">${redText}</span>` + rightText;
          } else {
            rightText =
              `<span class="redKey">${redText.slice(rightText.length - right)}</span>` + rightText;
          }
        }
      } else if (rightText?.length < right) {
        const startInfo = leftText.slice(0, left);
        if (rightText.length + redText.length <= left) {
          const sLen = right - redText.length - rightText.length;
          leftText = startInfo + '...' + (sLen != 0 ? leftText.slice(-sLen) : '');
          rightText = `<span class="redKey">${redText}</span>` + rightText;
        } else {
          rightText =
            `<span class="redKey">...${redText.slice(rightText.length - right)}</span>` + rightText;
          leftText = leftText.slice(0, left);
        }
      } else {
        leftText = leftText.slice(0, left) + `<span class="redKey">...</span>`;
        rightText = rightText.slice(rightText.length - right, rightText.length);
      }

      return `${leftText && leftText}${rightText && rightText}`;
    }
    return `${text?.substring(0, left)}...${text?.substring(text?.length - right)}`;
  } catch (error) {
    return text;
  }
};

export const changeKeyRed = (
  [shortName, fullName, address]: any,
  keyword: string,
  { direction = 'column', cutIndex = -1, cutLeft = 6, cutRight = 6 } = {},
) => {
  // When both shortName and fullName are passed in, the vertical columns of 721name and shortName on the home page are displayed
  try {
    keyword = escapeRegex(keyword);
    const Reg = new RegExp(keyword, 'ig');
    let itemData,
      shortRes = '',
      fullRes = '',
      addrRes = '',
      addrUp = '';
    const keywordUp = keyword.toLocaleUpperCase();
    if (address) addrUp = address.toLocaleUpperCase();
    if (shortName || fullName || address) {
      shortRes = shortName.replace(Reg, function (match: string) {
        return '<span class="redKey">' + match + '</span>';
      });
      if (fullName) {
        fullRes = fullName.replace(Reg, function (match: string) {
          return '<span class="redKey">' + match + '</span>';
        });
      }
      if (address) {
        addrRes = address.replace(Reg, function (match: string) {
          return '<span class="redKey">' + match + '</span>';
        });
      }

      let found = Reg.exec(shortName) || Reg.exec(fullName) || keywordUp === addrUp;

      if (cutIndex >= 0) {
        found = true;
        shortRes = cutMiddle(shortRes, cutLeft, cutRight, { cutRed: true });
        fullRes = cutMiddle(fullRes, cutLeft, cutRight, { cutRed: true });
        addrRes = cutMiddle(addrRes, cutLeft, cutRight, { cutRed: true });
      }

      itemData = {
        found,
        dom: fullName
          ? direction !== 'column'
            ? `<div>${fullRes}</div><div title="${fullName}">(${shortRes})</div>`
            : `<div>${fullRes}</div><div>${shortRes}</div>`
          : `<div>${shortRes}</div>`,
        addressDom: addrRes,
        addressFound: keywordUp === addrUp,
      };
      return itemData;
    }
  } catch (error) {
    log.info(error);
    return {};
  }
};

export const isDef = (val: any) => val !== undefined && val !== null;

const hasLength = (str: string): boolean => str.length > 0;

export const highlight = (text: string, query: string) => {
  query = escapeRegex(query);
  const reg = new RegExp(`(${query})`, 'i');

  const found = reg.test(text);

  if (!found) {
    return safeEscape(text);
  }

  const list = text
    .split(reg)
    .filter(hasLength)
    .map((str) => {
      const match = reg.test(str);
      if (match) {
        return '<span class="redKey">' + safeEscape(str) + '</span>';
      } else {
        return safeEscape(str);
      }
    });

  return list.join('');
};

export const escapeRegex = (str: string) => {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
