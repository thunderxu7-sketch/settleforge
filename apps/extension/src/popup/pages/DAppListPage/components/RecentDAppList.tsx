import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import { setGaEvent } from '../../../utils/gaUtils';
import { UsedDAppItemState } from '../../../../store/slices/dapp_list';

import styles from '../DAppListPage.m.scss';

import defaultDAppIcon from '../images/icon-dapp-default.svg';
import { Tooltip } from 'antd';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

interface Props {
  used: Array<UsedDAppItemState>;
}

const RecentDAppList: FC<Props> = ({ used }) => {
  return used && used.length > 0 ? (
    <div className={styles.recentDApp}>
      <h1>
        <FormattedMessage id="DAPP.RECENT_USED" />
      </h1>

      <div className={styles.list}>
        {used.map(({ home_url: href, image_url: icon, name }, index) => {
          if (index >= 5) {
            return;
          }

          return (
            <div
              key={name}
              className={styles.recentDAppItem}
              onClick={() => {
                setGaEvent('Dapp List', name, 'Recommend');
                window.open(href);
              }}
            >
              <img
                src={icon || defaultDAppIcon}
                onError={(e: any) => {
                  e.target.src = defaultDAppIcon;
                }}
              />
              <Tooltip
                title={name}
                overlayInnerStyle={toolTipsOverlayInnerStyle}
                placement="bottomLeft"
              >
                <p className={styles.name}>{name}</p>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <></>
  );
};

export default memo(RecentDAppList);
