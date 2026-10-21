import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { BigNumber } from 'bignumber.js';
import { Tooltip } from 'antd';

import type { PricesType } from '../../../../hooks/prices_info';
import type { TokenItemType } from '../../../../service/get_watch_asset_service';
import Toast from '../../../../components/Toast';

import IconForbid from '../../../../static/images/forbid.svg';
import IconDefaultToken from '../../../../static/images/default_token.svg';
import IconVerify from '../../../../static/images/icon-verify.svg';

import styles from '../WatchAsset.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

interface Props {
  tokenItem: TokenItemType;
  pricesInfo: PricesType;
  hostname: string;
}

const BN = BigNumber.clone({ DECIMAL_PLACES: 3, ROUNDING_MODE: 1 });

const TokenItem: FC<Props> = ({ tokenItem, pricesInfo, hostname }) => {
  const { formatMessage } = useIntl();
  const balanceStr = new BigNumber(tokenItem.balanceStr || 0).toFixed();
  const money = new BN(tokenItem.price || 0)
    .multipliedBy(balanceStr)
    .multipliedBy(pricesInfo.priceList[pricesInfo.selected])
    .div(1)
    .toFixed();

  return (
    <>
      <div className={styles.tokenInfoContainer}>
        <div className={styles.imageContainer}>
          <img
            src={tokenItem.type === -1 ? IconForbid : tokenItem.logoUrl || IconDefaultToken}
            onError={(e) => {
              e.currentTarget.src = IconDefaultToken;
            }}
            alt=""
            className={styles.tokenIcon}
          />

          {tokenItem.isOfficial == 1 && (
            <img src={IconVerify} className={styles.verifyIcon} alt="" />
          )}
        </div>

        <div className={styles.tokenInfoContainerRight}>
          {tokenItem.type === -1 ? (
            <div className={styles.nameWrapper}>
              <div className={styles.shortName}>
                <FormattedMessage id={'DETECT_NEW_TOKEN.INVALID_ASSETS'} />
              </div>
            </div>
          ) : (
            <div className={styles.nameWrapper}>
              <div className={styles.shortName}>{tokenItem.shortName}</div>
              <div className={styles.tokenName} title={tokenItem.name}>
                (
                {tokenItem.name && tokenItem.name.length > 10
                  ? `${tokenItem.name.substring(0, 5)}...${tokenItem.name.substring(
                      tokenItem.name.length - 5,
                    )}`
                  : tokenItem.name}
                )
              </div>
              {tokenItem.type === 5 && <div className={styles.trc721}>TRC721</div>}
            </div>
          )}

          <div className={styles.balanceWrapper}>
            <div className={styles.balance}>{tokenItem.balanceStr || '--'}</div>
            {tokenItem.type !== 5 && tokenItem.price > 0 && tokenItem.balance > 0 && (
              <div className={styles.money}>
                (≈{pricesInfo.symbol} {money})
              </div>
            )}
          </div>

          <div className={styles.addressWrapper}>
            {tokenItem.type == 1 && (
              <div className={styles.addressTitle}>
                <FormattedMessage id="DETECT_NEW_TOKEN.ID" />
              </div>
            )}
            <div className={styles.addressTitle}>
              {tokenItem.type !== 1 && tokenItem.address.length > 20
                ? `${tokenItem.address.substring(0, 10)}...${tokenItem.address.substring(
                    tokenItem.address.length - 10,
                  )}`
                : tokenItem.address}
            </div>

            <Tooltip
              title={formatMessage({
                id: 'TOOLTIP.COPY',
              })}
              overlayInnerStyle={toolTipsOverlayInnerStyle}
              overlayStyle={{
                paddingBottom: '2px',
              }}
            >
              <div
                className={styles.copyIcon}
                onClick={async (e) => {
                  Toast.show({
                    icon: 'success',
                    content: formatMessage({ id: 'TOAST.COPY' }),
                    duration: 2000,
                  });
                  await window.navigator.clipboard.writeText(tokenItem.address);
                }}
              />
            </Tooltip>
            {/* </CopyToClipboard> */}
          </div>
        </div>

        {tokenItem.isInAssets && (
          <div className={styles.addedContainer}>
            <FormattedMessage id="TOAST.ADDED" />
          </div>
        )}

        {tokenItem.type === -1 && (
          <div className={styles.inValidContainer}>
            <FormattedMessage id="DETECT_NEW_TOKEN.STATUS.FAILED" />
          </div>
        )}
      </div>

      <div
        className={styles.link}
        onClick={() => {
          let url = hostname;
          if (tokenItem.type === 1) {
            url += '/token/' + tokenItem.address;
          } else if (tokenItem.type === 5) {
            url += '/token721/' + tokenItem.address;
          } else {
            url += '/token20/' + tokenItem.address;
          }
          window.open(url);
        }}
      >
        <FormattedMessage id="DETECT_NEW_TOKEN.ENTRY_TRONSCAN.TITLE" /> {`>>`}
      </div>
    </>
  );
};

export default memo(TokenItem);
