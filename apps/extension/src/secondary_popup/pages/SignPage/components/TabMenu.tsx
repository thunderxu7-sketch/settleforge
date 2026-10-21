import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { useSignBiz } from '../hooks';

import styles from '../static/scss/common.m.scss';

const tabNavArr = [
  {
    index: 0,
    title: 'CONFIRMATIONS.DATA.DETAIL',
  },
  {
    index: 1,
    title: 'CONFIRMATIONS.DATA.ORIGINAL',
  },
];

interface Props {
  tabIndex: number;
  changeTab: (tabIndex: number) => void;
}

const TabMenu: FC<Props> = ({ tabIndex, changeTab }) => {
  return (
    <div className={styles.tabNav}>
      {tabNavArr.map((item) => {
        return (
          <div
            key={item.index}
            className={classNames({ [styles.active]: tabIndex === item.index }, 'cursorPointer')}
            onClick={() => {
              changeTab(item.index);
            }}
          >
            <FormattedMessage id={item.title} />
          </div>
        );
      })}
    </div>
  );
};

export default memo(TabMenu);
