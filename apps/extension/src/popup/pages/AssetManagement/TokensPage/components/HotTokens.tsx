import { FC, memo } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tooltip } from 'antd';

import Confirmation from '../../../../../components/Confirmation';
import AssetItem from '../../MyAssetsPage/components/AssetItem';
import { AssetItemType } from '../../../../../constants/types';
import { DeleteTokenType } from '../../MyAssetsPage/hook';
import { isTopAsset } from '../../../../utils/assetUtils';

import iconConfirm from '../../MyAssetsPage/images/icon_confirm.svg';
import iconAdd from '../../MyAssetsPage/images/icon_add.svg';
import Token10DefaultImg from '../../../../../static/images/token_10_default.svg';
import styles from '../TokensPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../../constants/style_object';

interface Props {
  hotTokens: any;
  historyTokens: any;
  clearHistory: any;
  clearTokenModalVisible: boolean;
  assetOperation: (item: AssetItemType, type: string) => void;
  onFollowAsset: (item: AssetItemType) => void;
  deleteToken: DeleteTokenType;
  tronscanHost: string;
  setClearTokenModalVisible: (visible: boolean) => void;
  cancelDeleteToken: () => void;
  confirmDeleteToken: () => void;
  searchHistoryKey: (keyWord: string) => void;
}

const CustomInfo: FC<Props> = ({
  hotTokens,
  historyTokens,
  tronscanHost,
  assetOperation,
  clearHistory,
  clearTokenModalVisible,
  setClearTokenModalVisible,
  onFollowAsset,
  deleteToken,
  cancelDeleteToken,
  confirmDeleteToken,
  searchHistoryKey,
}) => {
  const { formatMessage } = useIntl();

  return (
    <div className={classNames(styles.hotTokensPage, 'scroll')}>
      {historyTokens?.length > 0 && (
        <div className={styles.historyTokens}>
          <div className={styles.historyTitle}>
            <div className={styles.titleText}>
              <FormattedMessage id="ASSET.SEARCH.HISTORY" />
            </div>
            <div
              className={styles.clearTokens}
              onClick={() => setClearTokenModalVisible(true)}
            ></div>
          </div>

          <div className={styles.hisTokensList}>
            {historyTokens.map((item: any, index: React.Key | null | undefined) => {
              return (
                <div
                  className={styles.historyItem}
                  key={index}
                  onClick={() => searchHistoryKey(item?.keyWord)}
                >
                  {item?.url && (
                    <img
                      className={styles.historyItemIcon}
                      src={item?.url}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = Token10DefaultImg;
                      }}
                    />
                  )}
                  <div className={styles.historyItemText}>{item?.shortName || item?.keyWord}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={classNames(styles.hotTokens, 'scroll')}>
        <div className={styles.hotTitle}>
          <div className={styles.titleText}>
            <FormattedMessage id="ASSET.SEARCH.HOT_TOKEN" />
          </div>
        </div>

        <div className={classNames(styles.hotTokensList, 'scroll')}>
          {hotTokens.map((item: any, index: number) => {
            return (
              <div key={index}>
                <div className={classNames(styles.flAcent)}>
                  <AssetItem token={item} tronscanHost={tronscanHost}></AssetItem>
                  {!isTopAsset(item) &&
                    (item.isInAssets ? (
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
                    ))}
                </div>
                <div className={styles.assetItemLine}></div>
              </div>
            );
          })}
        </div>
      </div>

      <Confirmation
        show={clearTokenModalVisible}
        title={<FormattedMessage id="ASSET.SEARCH.CLEAR_ALL" />}
        body={<FormattedMessage id="ASSET.SEARCH.CLEAR_ALL_DESC" />}
        onClose={() => setClearTokenModalVisible(false)}
        onConfirmed={clearHistory}
      />

      {/* stop follow asset modal */}
      <Confirmation
        show={deleteToken.show}
        title={
          <FormattedMessage
            id={
              deleteToken.isCustom
                ? 'ASSET.CUSTOM.TIP.UNFOLLOW_TOKEN'
                : 'ASSET.CONFIRM.UNFOLLOW_ASSET'
            }
            values={{ symbol: deleteToken.symbol }}
          />
        }
        body={
          <FormattedMessage
            id={
              deleteToken.isCustom ? 'ASSET.CUSTOM.TIP.FOLLOW_AGAIN' : 'ASSET.CONFIRM.UNFOLLOW_TIPS'
            }
          />
        }
        onClose={cancelDeleteToken}
        onConfirmed={confirmDeleteToken}
      />
    </div>
  );
};

export default memo(CustomInfo);
