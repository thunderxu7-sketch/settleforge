import { FC, memo } from 'react';
import { useNavigate } from 'react-router';
import classNames from 'classnames';

import { usePricesInfo } from '../../../../../hooks/prices_info';
import { newTokenAmountAndWorth } from '../../../../utils/newTokenAmountAndWorth';
import { BigNumber, formatWithSpt } from '../../../../utils/numberUtils';
import PAGES from '../../../../../constants/pages';
import { setGaEvent } from '../../../../utils/gaUtils';

import styles from '../../HomePage.m.scss';

import TokenCustomDefaultImg from '../../../../../static/images/token_custom_default.svg';
import Token10DefaultImg from '../../../../../static/images/token_10_default.svg';
import Verify from '../../../../../static/images/icon-verify.svg';

interface Props {
  token: Record<string, any>;
  tokenDomList: any;
  balanceVisible: boolean;
}

const HomeAssetItem: FC<Props> = ({ token, tokenDomList = {}, balanceVisible }) => {
  const navigator = useNavigate();
  const { pricesInfo } = usePricesInfo();
  const {
    logoUrl,
    tokenStatus,
    isOfficial,
    balanceStr,
    balance,
    count,
    trxCount = 0,
    name,
    shortName,
    usdCount,
    cnyCount,
  } = token;

  let { type, price = 0 } = token;
  type = Number(type);
  const isCustomToken = Number(tokenStatus) === 1 || Number(tokenStatus) === 2;
  let amount = balanceStr || balance || count || 0;
  let name1 = shortName;
  let name2 = '';
  if (type !== 5) {
    amount = new BigNumber(amount);
  }

  if (type === 0) {
    // trx
    name1 = 'TRX';
    price = 1;
    amount = trxCount;
  }
  if (type === 5) {
    name1 = shortName;
    name2 = name;
  }

  const { amountStr, moneyStr } = newTokenAmountAndWorth(
    price,
    amount,
    pricesInfo,
    usdCount,
    cnyCount,
  );

  const navigatorToTransferList = (token: any) => {
    setGaEvent('Home', 'Click Token', `${token.shortName}(${token.contractAddress})`);
    navigator(`${PAGES.PAGE_ASSET_DETAIL}/token_transfer_list`, {
      state: { selectedToken: token },
    });
  };

  return (
    <div className={classNames(styles.assetItem)} onClick={() => navigatorToTransferList(token)}>
      <div className={classNames(styles.flAcent)}>
        <span className={styles.leftLogo}>
          <img
            className={classNames(styles.tokenLogo)}
            src={isCustomToken ? TokenCustomDefaultImg : logoUrl || Token10DefaultImg}
            onError={(e: any) => {
              e.target.src = Token10DefaultImg;
            }}
            alt=""
          />
          {Number(isOfficial) === 1 ? (
            <img className={classNames(styles.verify)} src={Verify} alt="" />
          ) : null}
        </span>
        <span
          className={styles.symbol}
          dangerouslySetInnerHTML={{
            __html:
              tokenDomList?.dom ||
              (type === 5 ? `<div>${name1}</div><div>${name2}</div>` : `<div>${name1}</div>`),
          }}
        />
      </div>
      <div className={classNames(styles.flCol, styles.flBottom)}>
        <div className={styles.tokenBalance}>
          {balanceVisible ? formatWithSpt(amountStr) : '*********'}
        </div>
        {type !== 5 && (
          <div className={styles.tokenBalanceUsd}>
            {balanceVisible ? `${formatWithSpt(moneyStr)}` : '*********'}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(HomeAssetItem);
