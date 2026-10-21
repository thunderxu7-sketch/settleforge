import { FC, memo } from 'react';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';

import AssetItem from './AssetItem';

import { isTopAsset } from '../../../../utils/assetUtils';
import { AssetItemType } from '../../../../../constants/types';

import iconNewAsset from '../images/icon_new_asset.svg';
import iconNew from '../images/icon-new.svg';
import iconAdd from '../images/icon_add.svg';

import styles from '../MyAssetsPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../../constants/style_object';

interface Props {
  asset: Array<any>;
  tronscanHost: string;
  onFollowAsset: (item: AssetItemType) => void;
  oneClickFollowAsset: () => void;
}

const NewAsset: FC<Props> = ({ asset = [], tronscanHost, onFollowAsset, oneClickFollowAsset }) => {
  const { formatMessage } = useIntl();
  return (
    <div className={classNames(styles.assetContainer, 'paddingLR16')}>
      <div className={classNames('flex', styles.titleContainer, styles.paddingTop20)}>
        <div className={styles.title}>
          <img src={iconNewAsset} />
          <span className={styles.titleText}>
            <FormattedMessage id={'ASSET.NEW.TITLE'} />
          </span>
          <img src={iconNew} className={styles.titleNewIcon} />
        </div>
        <div
          onClick={oneClickFollowAsset}
          className={classNames(styles.operation, 'cursorPointer', styles.followText)}
        >
          <FormattedMessage id={'ASSET.ONE_CLICK_FOLLOW'} />
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
                )}
              </div>
              <div className={styles.assetItemLine}></div>
            </div>
          );
        })}
      </>
    </div>
  );
};

export default memo(NewAsset);
