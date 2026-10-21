import { FC, memo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { setGaEvent } from '../../../utils/gaUtils';
import iconEnter from '../images/icon-enter.svg';

import styles from '../SettingsPage.m.scss';

interface Props {
  name: string;
  icon: string;
  targetPage: string;
  onClickRow?: () => void;
}

const SettingRow: FC<Props> = ({ icon, name, targetPage, onClickRow }) => {
  const navigate = useNavigate();

  const clickFn = useCallback(() => {
    if (name === 'SETTING.TITLE.NODE_MANAGE') {
      setGaEvent('Setting', 'Click Node Management', 'Click Node Management');
    } else if (name === 'SETTING.TITLE.ABOUT') {
      setGaEvent('Setting', 'Click About', 'Click About');
    } else if (name === 'SETTING.TITLE.LOCK') {
      setGaEvent('Setting', 'Log Out', 'Log Out');
    }

    if (onClickRow) {
      onClickRow();
    } else {
      navigate(targetPage);
    }
  }, [navigate, name, onClickRow, targetPage]);

  return (
    <div onClick={clickFn} className={classNames(styles.option, 'flex')}>
      <div className={styles.rowLeft}>
        <img src={icon} alt="" />
      </div>

      <div className={classNames(styles.rowRight, styles.borderBottom, 'flex')}>
        <span>
          <FormattedMessage id={name} />
        </span>
        <span>
          <img src={iconEnter} alt="" />
        </span>
      </div>
    </div>
  );
};

export default memo(SettingRow);
