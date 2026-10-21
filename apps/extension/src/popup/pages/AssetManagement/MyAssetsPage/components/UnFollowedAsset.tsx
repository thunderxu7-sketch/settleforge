import { FC, memo } from 'react';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useIntl, FormattedMessage } from 'react-intl';

import AssetItem from './AssetItem';
import { AssetItemType, AssetType } from '../../../../../constants/types';

import iconUnFollowedAsset from '../images/icon_unfollowed_asset.svg';
import iconAdd from '../images/icon_add.svg';

import styles from '../MyAssetsPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../../constants/style_object';

interface Props {
  asset: AssetType;
  tronscanHost: string;
  onFollowAsset: (item: AssetItemType) => void;
}

const UnFollowedAsset: FC<Props> = ({ asset = [], tronscanHost, onFollowAsset }) => {
  const { formatMessage } = useIntl();
  return (
    <div className={classNames(styles.assetContainer, 'paddingLR16')}>
      <div className={classNames('flex', styles.titleContainer, styles.paddingTop20)}>
        <div className={styles.title}>
          <img src={iconUnFollowedAsset} />
          <span className={styles.titleText}>
            <FormattedMessage id={'ASSET.UN_FOLLOWED.TITLE'} />
          </span>
        </div>
      </div>
      <>
        {asset.map((item, index) => {
          return (
            <div key={index}>
              <div className={classNames(styles.rowItem, 'flex')}>
                <AssetItem token={item} tronscanHost={tronscanHost}></AssetItem>
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
              </div>
              <div className={styles.assetItemLine}></div>
            </div>
          );
        })}
      </>
    </div>
  );
};

export default memo(UnFollowedAsset);
