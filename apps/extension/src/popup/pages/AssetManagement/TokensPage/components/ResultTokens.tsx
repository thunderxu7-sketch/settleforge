import { FC, memo } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tooltip } from 'antd';

import Confirmation from '../../../../../components/Confirmation';
import AssetItem from '../../MyAssetsPage/components/AssetItem';
import NoResult from './NoResult';
import { DeleteTokenType } from '../../MyAssetsPage/hook';
import { isRiskAsset, isTopAsset } from '../../../../utils/assetUtils';

import iconConfirm from '../../MyAssetsPage/images/icon_confirm.svg';
import iconAdd from '../../MyAssetsPage/images/icon_add.svg';

import styles from '../TokensPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../../constants/style_object';

interface Props {
  tronscanHost: string;
  searchResultTokens: any;
  assetOperation: (item: any, type: string) => void;
  onFollowAsset: (item: any) => void;
  deleteToken: DeleteTokenType;
  cancelDeleteToken: () => void;
  confirmDeleteToken: () => void;
  searchValue: string;
  tokenDomList: any;
  showCustomEntry: boolean;
  currentFilterType: number;
  setCurrentFilterType: (type: number) => void;
}

const ResultTokens: FC<Props> = ({
  searchResultTokens,
  tronscanHost,
  assetOperation,
  onFollowAsset,
  deleteToken,
  cancelDeleteToken,
  confirmDeleteToken,
  searchValue,
  tokenDomList,
  showCustomEntry,
  currentFilterType,
  setCurrentFilterType,
}) => {
  const { formatMessage } = useIntl();
  const tabs = [
    {
      name: formatMessage({ id: 'ASSET.CUSTOM.ALL' }),
      type: 0,
    },
    {
      name: 'TRC10',
      type: 1,
    },
    {
      name: 'TRC20',
      type: 2,
    },
    {
      name: 'TRC721',
      type: 5,
    },
  ];
  let userSearchResult = searchResultTokens;

  return (
    <div>
      <div className={styles.filterSorts}>
        <div className={styles.filterLi}>
          <FormattedMessage id="ASSET.ASSET_MANAGE.TITLE_FILTER" />
        </div>

        <div className={styles.sortsLi}>
          {tabs.map((item, index) => {
            return (
              <div
                className={styles.filterLi}
                key={index}
                onClick={() => {
                  setCurrentFilterType(item.type);
                }}
              >
                <div
                  className={classNames(
                    styles.checkbox,
                    currentFilterType === item.type ? styles.active : '',
                  )}
                ></div>
                <div className={styles.sort}>{item.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {userSearchResult?.length > 0 ? (
        <div className={styles.searchResult}>
          <div className={styles.title}>
            <FormattedMessage id="ASSET.SEARCH.RESULT" />
          </div>

          <div className={classNames(styles.resultContainer, 'scroll')}>
            <div className={styles.searchResultList}>
              {userSearchResult.map((item: any, index: number) => {
                return (
                  tokenDomList[index]?.found && (
                    <div key={index}>
                      <div className={classNames(styles.flAcent)}>
                        <AssetItem
                          token={item}
                          tronscanHost={tronscanHost}
                          tokenDomList={tokenDomList[index]}
                          searchValue={searchValue}
                        ></AssetItem>
                        {!isTopAsset(item) ? (
                          item.isInAssets ? (
                            <Tooltip
                              placement="topRight"
                              title={formatMessage({
                                id: 'ASSET.CLICK_TO_UN_FOLLOW',
                              })}
                              overlayInnerStyle={toolTipsOverlayInnerStyle}
                            >
                              <img
                                src={iconConfirm}
                                alt=""
                                className={styles.operationBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  assetOperation && assetOperation(item, 'unfocus');
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip
                              placement="topRight"
                              title={formatMessage({
                                id: 'ASSET.CLICK_TO_FOLLOW',
                              })}
                              overlayInnerStyle={toolTipsOverlayInnerStyle}
                            >
                              <img
                                src={iconAdd}
                                alt=""
                                className={styles.operationBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFollowAsset && onFollowAsset(item);
                                }}
                              />
                            </Tooltip>
                          )
                        ) : (
                          ''
                        )}
                        {isRiskAsset(item) && (
                          <div className={styles.risk}>
                            {formatMessage({
                              id: 'ASSET.RISK_TOKEN.TIP',
                            })}
                          </div>
                        )}
                      </div>
                      <div className={styles.assetItemLine}></div>
                    </div>
                  )
                );
              })}
            </div>

            {userSearchResult?.length === 100 && (
              <div
                className={styles.resultTip}
                dangerouslySetInnerHTML={{
                  __html: formatMessage(
                    {
                      id: 'ASSET.SEARCH.NOT_FIND_ASSET',
                    },
                    {
                      amount: '<span>100</span>',
                    },
                  ),
                }}
              ></div>
            )}
          </div>
        </div>
      ) : (
        <NoResult showCustomEntry={showCustomEntry} searchValue={searchValue} />
      )}

      {/* stop follow asset modal */}
      <Confirmation
        show={deleteToken?.show}
        title={
          <FormattedMessage
            id={
              deleteToken?.isCustom
                ? 'ASSET.CUSTOM.TIP.UNFOLLOW_TOKEN'
                : 'ASSET.CONFIRM.UNFOLLOW_ASSET'
            }
            values={{ symbol: deleteToken.symbol }}
          />
        }
        body={
          <FormattedMessage
            id={
              deleteToken?.isCustom
                ? 'ASSET.CUSTOM.TIP.FOLLOW_AGAIN'
                : 'ASSET.CONFIRM.UNFOLLOW_TIPS'
            }
          />
        }
        onClose={cancelDeleteToken}
        onConfirmed={confirmDeleteToken}
      />
    </div>
  );
};

export default memo(ResultTokens);
