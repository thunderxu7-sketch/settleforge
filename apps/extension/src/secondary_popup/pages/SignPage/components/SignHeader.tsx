import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Tooltip } from 'antd';
import classNames from 'classnames';

import leftArrowIcon from '../static/images/icon-arrow-left-thin.svg';
import rightArrowIcon from '../static/images/icon-arrow-right-thin.svg';
import Tronlink from '../static/images/tronlink.svg';

import styles from '../static/scss/common.m.scss';

interface Props {
  selectedIndex: number;
  selectPrevious: () => void;
  hostname: string;
  confirmations: Array<any>;
  selectNext: () => void;
}

const SignHeader: FC<Props> = ({
  selectedIndex,
  selectPrevious,
  hostname,
  confirmations,
  selectNext,
}) => {
  return (
    <div className={styles.header}>
      {selectedIndex > 0 && (
        <img
          src={leftArrowIcon}
          onClick={selectPrevious}
          className={classNames(styles.arrowIcon, 'cursorPointer')}
        />
      )}
      <div className={styles.hostname}>
        <span>
          <Tooltip placement="bottom" title={hostname}>
            {hostname.length > 25 ? hostname.substring(0, 22) + '...' : hostname}
          </Tooltip>
        </span>
        <span className={styles.gap4}>
          <FormattedMessage id="CONFIRMATIONS.NEW.BODY" />
        </span>
        <img src={Tronlink} className={classNames(styles.gap4, 'logoImg')} />
      </div>

      {selectedIndex < confirmations.length - 1 && (
        <img
          src={rightArrowIcon}
          onClick={selectNext}
          className={classNames(styles.arrowIcon, 'cursorPointer')}
        />
      )}
    </div>
  );
};
export default memo(SignHeader);
