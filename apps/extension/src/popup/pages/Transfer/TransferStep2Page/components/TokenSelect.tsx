import { FC, memo, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Drawer, Input } from 'antd';
import classNames from 'classnames';
import Icon from '@ant-design/icons';

import { BigNumber } from '../../../../utils/numberUtils';
import { newTokenAmountAndWorth } from '../../../../utils/newTokenAmountAndWorth';
import { getTokenId, isCustomToken, isSelectedToken } from '../../utils/token';
import { generateSelectedText } from '../../utils/generateSelectedText';

import { AssetItemType, AssetType } from '../../../../../constants/types';
import { TOKEN_TYPE_MAP_NAME } from '../../../../../constants/common';
import { PricesType } from '../../../../../hooks/prices_info';

import LazyImage from './LazyImage';

import styles from '../TransferStep2Page.m.scss';

import TokenCustomDefaultImg from '../images/token_custom_default.svg';
import Token10DefaultImage from '../images/token_10_default.svg';
import NoResult from '../images/icon-no-result.svg';
import CloseSelect from '../images/icon-close-select.svg';
import SearchInput from '../images/icon-search-input.svg';

interface Props {
  showTokenSelect: boolean;
  allTokenList: AssetType;
  selectedToken: AssetItemType;
  tokenSearchKey: string;
  tokenFilterCondition: number;

  prices: PricesType;
  setShowTokenSelect: (isShow: boolean) => void;
  setSelectedToken: (token: AssetItemType) => void;
  setTokenSearchKey: (tokenId: string) => void;
  setTokenFilterCondition: (type: number) => void;
}

enum FilterNames {
  All,
  TRC10,
  TRC20,
  TRC721 = 5,
}

const TokenSelect: FC<Props> = ({
  showTokenSelect,
  allTokenList,
  selectedToken,
  tokenSearchKey,
  tokenFilterCondition,
  prices,
  setShowTokenSelect,
  setSelectedToken,

  setTokenSearchKey,
  setTokenFilterCondition,
}) => {
  const { formatMessage } = useIntl();
  const maxShowTokenLength = 100;
  const allFilterCondition = [0, 5, 2, 1];
  const [tokenList, setTokenList] = useState([]);

  useEffect(() => {
    const filterResult = allTokenList.filter((item) => {
      const { type } = item;

      if (tokenFilterCondition === 0) {
        return true;
      }
      return tokenFilterCondition === type;
    });

    const result = filterResult.filter((item) => {
      const { shortName, name } = item;
      const tokenId = getTokenId(item);
      const abbrPair = shortName.toUpperCase().indexOf(tokenSearchKey.toUpperCase()) !== -1;
      const namePair = name.toUpperCase().indexOf(tokenSearchKey.toUpperCase()) !== -1;
      const tokenIdPair = tokenId === tokenSearchKey;

      if (abbrPair || namePair || tokenIdPair) {
        return true;
      }
      return false;
    });

    // @ts-ignore
    setTokenList(result);
  }, [tokenSearchKey, tokenFilterCondition, allTokenList]);

  return (
    <div className={styles.tokenSelect} id="tokenSelect">
      <Drawer
        title={formatMessage({ id: 'ACCOUNT.SEND.CHOOSE_TOKEN' })}
        height={520}
        placement={'bottom'}
        onClose={() => {
          setShowTokenSelect(false);
        }}
        visible={showTokenSelect}
        closeIcon={<img src={CloseSelect} />}
        getContainer={() => {
          return document.querySelector('#tokenSelect') ?? document.body;
        }}
        maskStyle={{
          background: 'rgba(35, 44, 65, 0.86)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className={styles.inputBox}>
          <Input
            value={tokenSearchKey}
            size="large"
            allowClear
            placeholder={formatMessage({ id: 'ACCOUNT.SEND.TOKEN_SELECT_PLACEHOLDER' })}
            prefix={<Icon component={() => <img src={SearchInput} />} />}
            onChange={(e) => {
              setTokenSearchKey(e.target.value);
            }}
          />
        </div>
        <div className={styles.filterList}>
          <div className={styles.title}>
            <FormattedMessage id="ASSET.ASSET_MANAGE.TITLE_FILTER" />
          </div>
          {allFilterCondition.map((item, index) => (
            <div
              key={index}
              className={classNames(
                styles.filterItem,
                item === tokenFilterCondition ? styles.selected : '',
              )}
              onClick={() => {
                setTokenFilterCondition(item);
              }}
            >
              <i></i>
              {item === 0 ? (
                <FormattedMessage id="ASSET.CUSTOM.ALL" />
              ) : (
                <span>{FilterNames[item]}</span>
              )}
            </div>
          ))}
        </div>

        {tokenList.length > 0 ? (
          <>
            {tokenSearchKey.length > 0 && (
              <p className={styles.searchTitle}>
                <FormattedMessage id="ASSET.SEARCH.RESULT" />
              </p>
            )}
            <div className={styles.searchList}>
              <div>
                {tokenList.map((item) => {
                  const {
                    name,
                    id,
                    count,
                    contractAddress,
                    type,
                    logoUrl,
                    price,
                    balance,
                    balanceStr,
                    precision,
                    tokenStatus,
                    isOfficial,
                    shortName,
                    trxCount,
                    usdCount,
                    cnyCount,
                  } = item;
                  const defaultImg = isCustomToken(tokenStatus)
                    ? TokenCustomDefaultImg
                    : Token10DefaultImage;
                  const tokenImg = logoUrl || defaultImg;
                  const address = type === 1 ? `ID: ${id}` : contractAddress;
                  const isVerify = isOfficial === 1;
                  const tokenId = type === 1 ? id : type === 2 || type === 5 ? contractAddress : '';

                  const typeName = isCustomToken(tokenStatus)
                    ? formatMessage({ id: 'ASSET.MENU.SORT_BY_MANUAL' })
                    : TOKEN_TYPE_MAP_NAME[type];

                  // for 721 token, search api need use balanceStr, collection api need use count as nft amount
                  let value: string | number = type === 5 ? count ?? balanceStr : 0;
                  let money = '0';
                  if (type !== 5) {
                    const d = precision;
                    const BN = BigNumber.clone({
                      DECIMAL_PLACES: d,
                      // @ts-ignore
                      ROUNDING_MODE: Math.min(8, d),
                      EXPONENTIAL_AT: [-20, 30],
                    });
                    const amount = new BN(balanceStr !== undefined ? balanceStr : balance);
                    const { amountStr, moneyStr } = newTokenAmountAndWorth(
                      price,
                      amount,
                      prices,
                      usdCount,
                      cnyCount,
                    );
                    money = moneyStr;
                    value = amountStr;
                  }

                  return (
                    <div
                      className={classNames(
                        styles.searchItem,
                        isSelectedToken(tokenId, selectedToken) ? styles.selected : '',
                      )}
                      key={tokenId}
                      onClick={() => {
                        setSelectedToken(item);
                        setShowTokenSelect(false);
                      }}
                    >
                      <div className={styles.tokenImg}>
                        <LazyImage defaultSrc={defaultImg} realSrc={tokenImg} />
                        {isVerify && <i></i>}
                      </div>
                      <div className={styles.tokenInfo}>
                        <div className={styles.tokenNames}>
                          {generateSelectedText(shortName, tokenSearchKey)}

                          <div className={styles.name}>
                            <i>(</i>
                            {generateSelectedText(name, tokenSearchKey)}
                            <i>)</i>
                          </div>

                          {type !== 0 && (
                            <div
                              className={classNames(
                                styles.typeName,
                                isCustomToken(tokenStatus)
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
                        <p className={styles.tokenValue}>
                          <span>{value}</span>
                          {type !== 5 && <span className={styles.price}> ({money})</span>}
                        </p>
                        <div className={styles.tokenAddress}>
                          {generateSelectedText(address, tokenSearchKey, true)}
                        </div>
                      </div>
                      <div className={styles.selectedIcon}></div>
                    </div>
                  );
                })}
              </div>

              {tokenSearchKey &&
                tokenSearchKey.length > 0 &&
                tokenList.length >= maxShowTokenLength && (
                  <div className={styles.bottomTips}>
                    <FormattedMessage
                      id="TRANSFER.STEP_2.SEARCH_TOKEN_TIPS"
                      values={{
                        span: (value: any) => <span>{value}</span>,
                        br: () => <br />,
                        searchAmount: maxShowTokenLength,
                      }}
                    />
                  </div>
                )}
            </div>
          </>
        ) : (
          <div className={styles.noResult}>
            <img src={NoResult} alt="" />
            <div className={styles.desc}>
              <FormattedMessage id="ASSET.SEARCH.NOT_FIND" />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default memo(TokenSelect);
