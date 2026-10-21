import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import styles from '../MyAssetsPage.m.scss';

const tabNavArr = [
  {
    index: 0,
    title: 'ASSET.ASSET',
  },
  {
    index: 1,
    title: 'ASSET.COLLECTION',
  },
];
interface Props {
  tabIndex: number;
  changeTab: (tabIndex: number) => void;
}

const TabMenu: FC<Props> = ({ tabIndex, changeTab }) => {
  return (
    <div className={classNames(styles.tabMenu, 'marginLR16')}>
      <div className={styles.tabNav}>
        {tabNavArr.map((item) => {
          return (
            <div
              key={item.index}
              className={classNames({ [styles.active]: tabIndex === item.index })}
              onClick={() => {
                changeTab(item.index);
              }}
            >
              <FormattedMessage id={item.title} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(TabMenu);
