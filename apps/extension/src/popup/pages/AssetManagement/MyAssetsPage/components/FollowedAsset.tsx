import { FC, memo } from 'react';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';

import Confirmation from '../../../../../components/Confirmation';
import AssetItem from './AssetItem';

import { isTopAsset } from '../../../../utils/assetUtils';
import { AssetItemType, AssetType } from '../../../../../constants/types';
import { DeleteTokenType } from '../hook';

import styles from '../MyAssetsPage.m.scss';

import iconFollowedAsset from '../images/icon_followed_asset.svg';
import iconHideTokenAsZero from '../images/icon_hide_little_asset_active.svg';
import iconHideLittleAssetInActive from '../images/icon_hide_little_asset_inactive.svg';
import iconConfirm from '../images/icon_confirm.svg';
import { toolTipsOverlayInnerStyle } from '../../../../../constants/style_object';

interface Props {
  asset: AssetType;
  onClickHideTokenAsZero: () => void;
  hideTokenAsZero: boolean;
  tronscanHost: string;
  assetOperation: (item: AssetItemType, type: string) => void;
  deleteToken: DeleteTokenType;
  cancelDeleteToken: () => void;
  confirmDeleteToken: () => void;
}

const FollowedAsset: FC<Props> = ({
  asset = [],
  onClickHideTokenAsZero,
  hideTokenAsZero = false,
  tronscanHost,
  assetOperation,
  deleteToken,
  cancelDeleteToken,
  confirmDeleteToken,
}) => {
  const { formatMessage } = useIntl();
  return (
    <div className={classNames(styles.assetContainer, 'paddingLR16')}>
      <div className={classnames('flex', styles.titleContainer, styles.paddingTop20)}>
        <div className={styles.title}>
          <img src={iconFollowedAsset} />
          <span className={styles.titleText}>
            <FormattedMessage id={'ASSET.FOLLOWED.TITLE'} />
          </span>
        </div>
        <div
          onClick={onClickHideTokenAsZero}
          className={classNames(styles.operation, 'cursorPointer')}
        >
          <img src={hideTokenAsZero ? iconHideTokenAsZero : iconHideLittleAssetInActive} />
          <span>
            <FormattedMessage id={'ASSET.MENU.HIDE_SMALL_BALANCES'} />
          </span>
        </div>
      </div>
      <>
        {asset.map((item, index) => {
          return (
            <div key={index}>
              <div className={classNames(styles.rowItem, 'flex')}>
                <AssetItem token={item} tronscanHost={tronscanHost}></AssetItem>
                {!isTopAsset(item) && (
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
                )}
              </div>
              <div className={styles.assetItemLine}></div>
            </div>
          );
        })}
      </>
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

export default memo(FollowedAsset);
