import { FC } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import { Tooltip } from 'antd';
import classNames from 'classnames';

import { usePricesInfo } from '../../../../../hooks/prices_info';
import { newTokenAmountAndWorth } from '../../../../utils/newTokenAmountAndWorth';
import PAGES from '../../../../../constants/pages';
import { AssetItemType } from '../../../../../constants/types';
import { TOKEN_TYPE_MAP_NAME } from '../../../../../constants/common';
import { toolTipsOverlayInnerStyle } from '../../../../../constants/style_object';
import { changeKeyRed, cutMiddle } from '../../../../utils';
import { BigNumber } from '../../../../utils/numberUtils';
import { setGaEvent } from '../../../../utils/gaUtils';

import Verify from '../../../../../static/images/icon-verify.svg';
import TokenCustomDefaultImg from '../../../../../static/images/token_custom_default.svg';
import Token10DefaultImg from '../../../../../static/images/token_10_default.svg';

import styles from '../MyAssetsPage.m.scss';
import Toast from '../../../../../components/Toast';

interface Props {
  token: AssetItemType;
  tronscanHost: string;
  tokenDomList?: any;
  searchValue?: string;
}

const AssetItem: FC<Props> = ({ token, tronscanHost, tokenDomList = [], searchValue = '' }) => {
  const navigator = useNavigate();
  const { pricesInfo } = usePricesInfo();
  const { formatMessage } = useIntl();
  const {
    logoUrl,
    tokenStatus,
    isOfficial,
    balanceStr,
    contractAddress,
    balance,
    count,
    id,
    name,
    shortName,
    trxCount,
    usdCount,
    cnyCount,
  } = token;
  let { type, price = 0 } = token;
  type = Number(type);

  const isCustomToken = Number(tokenStatus) === 1 || Number(tokenStatus) === 2;

  const typeName = isCustomToken
    ? formatMessage({ id: 'ASSET.MENU.SORT_BY_MANUAL' })
    : TOKEN_TYPE_MAP_NAME[type];

  let amount = new BigNumber(balanceStr || balance || count || 0);
  let name1 = shortName; //abbr || name;
  let name2 = name; // name;
  if (type !== 5) {
    amount = new BigNumber(amount);
  }

  if (type === 0) {
    // trx
    price = 1;
    name1 = 'TRX';
    name2 = 'TRON';
    amount = new BigNumber(trxCount);
  }

  let tokenId = '';
  let tokenIdDisplay = '';
  if (type === 1) {
    tokenId = id; //
    tokenIdDisplay = `ID: ${id}`;
  }
  if (type === 2 || type === 5) {
    tokenId = contractAddress;
    tokenIdDisplay = contractAddress;
  }
  const { amountStr, moneyStr } = newTokenAmountAndWorth(
    price,
    amount,
    pricesInfo,
    usdCount,
    cnyCount,
  );
  const openTronscan = (type: number, tokenId: string) => {
    let url = tronscanHost;
    if (type === 0) {
      url += 'token/0/';
    } else if (type === 1) {
      url += `token/${tokenId}`;
    } else {
      url += `token20/${tokenId}`;
    }
    window.open(url);
  };

  const navigatorToTransferList = (token: AssetItemType) => {
    setGaEvent('MyAssetPage', 'Click Token', `${shortName}(${tokenId})`);
    navigator(`${PAGES.PAGE_ASSET_DETAIL}/token_transfer_list`, {
      state: { selectedToken: token },
    });
  };

  const renderResultAddress = (tokenIdDisplay: string) => {
    if (type === 2 || type === 5) {
      if (searchValue) {
        const changeRedResult = changeKeyRed([tokenIdDisplay], searchValue, {
          cutIndex: 0,
          cutLeft: 10,
          cutRight: 10,
        });
        if (changeRedResult?.found) {
          if (changeRedResult?.dom) {
            return changeRedResult.dom;
          }
        }
      }
      return cutMiddle(tokenIdDisplay, 10, 10);
    }
    return tokenIdDisplay;
  };

  return (
    <div className={classNames(styles.tokenItem)}>
      <div className={classNames(styles.content)}>
        <div className={classNames(styles.logo)}>
          <img
            className={classNames(styles.tokenImg)}
            src={isCustomToken ? TokenCustomDefaultImg : logoUrl || Token10DefaultImg}
            onError={(e) => {
              (e.target as HTMLImageElement).src = Token10DefaultImg;
            }}
            alt=""
          />
          {Number(isOfficial) === 1 ? (
            <img className={classNames(styles.verify)} src={Verify} alt="" />
          ) : null}
        </div>
        <div className={classNames(styles.detail)}>
          <div className={classNames(styles.info)}>
            <div
              className={classNames(styles.name)}
              dangerouslySetInnerHTML={{
                __html:
                  tokenDomList?.dom || `<div>${name1}</div><div title='${name}'>(${name2})</div>`,
              }}
            ></div>

            {type !== 0 && (
              <div
                className={classNames(
                  styles.typeName,
                  isCustomToken
                    ? styles.custom
                    : type === 5
                    ? styles.trc721
                    : type === 2
                    ? styles.trc20
                    : styles.trc10,
                )}
              >
                {typeName}
              </div>
            )}
          </div>
          <div className={styles.num}>
            <div className={styles.numWrap}>
              <span className={classNames(styles.amount)}>{type === 5 ? count : amountStr}</span>
              {type !== 5 && <span className={classNames(styles.price)}>{`(${moneyStr})`}</span>}
            </div>
            {type === 0 && (
              <Tooltip
                overlayInnerStyle={toolTipsOverlayInnerStyle}
                title={formatMessage({
                  id: 'TRANSACTION.TOKEN_INFO.DETAIL',
                })}
              >
                <div
                  className={classNames(styles.imgGap, styles.iconDetail)}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatorToTransferList(token);
                  }}
                />
              </Tooltip>
            )}
          </div>
          {type != 0 && (
            <div className={classNames(styles.addressWrap)}>
              {tokenIdDisplay && (
                <div
                  className={classNames(styles.address, tokenDomList?.addressFound ? 'redKey' : '')}
                  dangerouslySetInnerHTML={{
                    __html: renderResultAddress(tokenIdDisplay),
                  }}
                ></div>
              )}
              <Tooltip
                overlayInnerStyle={toolTipsOverlayInnerStyle}
                title={formatMessage({
                  id: 'TOOLTIP.COPY',
                })}
              >
                <div
                  className={classNames(styles.imgGap, styles.iconCopy)}
                  onClick={async (e) => {
                    e.stopPropagation();

                    Toast.show({
                      icon: 'success',
                      content: formatMessage({
                        id: 'TOAST.COPY',
                      }),
                    });

                    await window.navigator.clipboard.writeText(tokenId);
                  }}
                />
              </Tooltip>
              <Tooltip
                title={formatMessage({
                  id: 'TRANSACTION.TOKEN_INFO.DETAIL',
                })}
                overlayInnerStyle={toolTipsOverlayInnerStyle}
              >
                <div
                  className={classNames(styles.imgGap, styles.iconDetail)}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatorToTransferList(token);
                  }}
                />
              </Tooltip>
            </div>
          )}
          <div
            id={'id_' + tokenId}
            onClick={(e) => {
              e.stopPropagation();
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AssetItem;
