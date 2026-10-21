import { ChangeEvent, FC, memo } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

import { PricesType } from '../../../../../hooks/prices_info';
import { AssetItemType } from '../../../../../constants/types';
import { NOT_SUPPORT_MAPPER } from '../../../../../constants/common';
import { BigNumber } from '../../../../utils/numberUtils';
import { filterTronLinkNoFunctions } from '../../../../utils/assetUtils';
import { newTokenAmountAndWorth } from '../../../../utils/newTokenAmountAndWorth';

import ResizableText from '../../../../../components/ResizableText';

import styles from '../TokenTransferListPage.m.scss';

import tokenDefault from '../images/token_10_default.svg';
import tokenCustom from '../images/token_custom_default.svg';

interface Props {
  trxFrozenBalance: string;
  trxAvailableBalance: string;
  trxBalance: string;
  pricesInfo: PricesType;
  selectedToken: AssetItemType;
  freezeUrl: string;
  noFunctions: string[];
  showRiskTips: boolean;
  showSyncTip: boolean;

  setShowRiskTips: (isShow: boolean) => void;
  setShowSyncTips: (isShow: boolean) => void;
  setShowSyncModal: (isShow: boolean) => void;
}

const TokenInfo: FC<Props> = ({
  trxFrozenBalance,
  trxAvailableBalance,
  trxBalance,
  pricesInfo,
  selectedToken,
  freezeUrl,
  noFunctions,
  showRiskTips,
  showSyncTip,

  setShowRiskTips,
  setShowSyncTips,
  setShowSyncModal,
}) => {
  let {
    balanceStr,
    price = 0,
    type,
    logoUrl,
    shortName,
    count,
    tokenStatus,
    precision,
    usdCount,
    cnyCount,
  } = selectedToken;
  let amount = balanceStr || 0;
  if (type === 0) {
    price = 1;
    precision = 6;
    amount = trxBalance;
  }

  const isCustomToken = tokenStatus === 1 || tokenStatus === 2;
  const { amountStr, moneyStr } = newTokenAmountAndWorth(
    price,
    new BigNumber(amount),
    pricesInfo,
    usdCount,
    cnyCount,
    { amountDecimal: precision },
  );
  const tokenImg = isCustomToken ? tokenCustom : logoUrl || tokenDefault;
  const filterNoFunctions = filterTronLinkNoFunctions(noFunctions, type);

  return (
    <div
      className={classNames(
        styles.tokenInfo,
        type === 0 && styles.trxInfo,
        type === 5 && styles.nftInfo,
      )}
    >
      {showRiskTips && (
        <div className={styles.riskTips}>
          <i></i>
          <p>
            <FormattedMessage id="ASSET.ASSET_MANAGE.RISK_TOKEN.TIP" />
          </p>
          <i
            onClick={() => {
              setShowRiskTips(false);
            }}
          ></i>
        </div>
      )}

      {!showRiskTips && showSyncTip && (
        <div
          className={styles.syncTips}
          onClick={() => {
            setShowSyncModal(true);
          }}
        >
          <i></i>
          <p>
            <FormattedMessage id="ASSET.CUSTOM.TIP.SYNC_TOKEN" />
          </p>
          <i
            onClick={(e) => {
              e.stopPropagation();
              setShowSyncTips(false);
            }}
          ></i>
        </div>
      )}
      <img
        className={styles.tokenImg}
        src={tokenImg}
        onError={(e: ChangeEvent<HTMLImageElement>) => {
          e.target.src = tokenDefault;
        }}
      />

      {type !== 5 ? (
        <>
          <div className={styles.value}>
            <div className={styles.tokenAmount}>{amountStr}</div>
            {price > 0 && (
              <div className={styles.price}>
                {moneyStr.replace(pricesInfo.symbol, '')} {pricesInfo.selected}
              </div>
            )}
          </div>

          {type === 0 && (
            <div className={styles.trxDesc}>
              <div className={styles.available}>
                <p className={styles.amount}>
                  <ResizableText
                    initSize={16}
                    text={new BigNumber(trxAvailableBalance).toFormat()}
                  />
                </p>
                <p className={styles.text}>
                  <FormattedMessage id="TRANSACTION.TOKEN_INFO.AVAILABLE_BALANCE" />
                </p>
              </div>
              <div
                className={styles.frozen}
                onClick={() => {
                  window.open(freezeUrl, 'tronscan');
                }}
              >
                <p className={styles.amount}>
                  <ResizableText initSize={16} text={new BigNumber(trxFrozenBalance).toFormat(0)} />
                </p>
                <p className={styles.text}>
                  <FormattedMessage id="TOKEN_TRANSFER.TRX.FROZEN" />
                  <i></i>
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className={styles.nftCount}>
          {count} {shortName}
        </p>
      )}

      {_.size(filterNoFunctions) > 0 && (
        <div className={styles.notSupportTip}>
          {filterNoFunctions.map((functionId: string) => {
            return (
              <div className={styles.tipItem} key={functionId}>
                <i>-</i>
                <FormattedMessage id={NOT_SUPPORT_MAPPER[functionId]} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(TokenInfo);
