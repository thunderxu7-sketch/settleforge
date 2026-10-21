import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Tooltip } from 'antd';

import { setGaEvent } from '../../../utils/gaUtils';
import { RecommendDAppItemState } from '../../../../store/slices/dapp_list';

import styles from '../DAppListPage.m.scss';

import defaultDAppIcon from '../images/icon-dapp-default.svg';

interface Props {
  recommend: Array<RecommendDAppItemState>;
}

const RecommendDAppList: FC<Props> = ({ recommend }) => {
  return (
    <div className={styles.recommendDApp} id="recommendDApp">
      <h1>
        <FormattedMessage id="DAPP.NAV.RECOMMEND" />
      </h1>

      <div className={styles.list}>
        {recommend.map(({ name, desc, icon, href }, index) => {
          return (
            <div
              key={index}
              className={styles.recommendDAppItem}
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
              <div className={styles.text}>
                <p className={styles.name}>{name}</p>
                <Tooltip
                  title={desc}
                  getPopupContainer={() => {
                    return document.querySelector('#recommendDApp') ?? document.body;
                  }}
                >
                  <p className={styles.desc}>{desc}</p>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(RecommendDAppList);
