import { useCallback, memo } from 'react';
import { useNavigate } from 'react-router';
import { FormattedMessage } from 'react-intl';

import NavBar from '../../../../../components/NavBar/NavBar';

import styles from './ReceiveNavBar.m.scss';

import IconBack from '../../images/icon_back_white.svg';

const ReceiveNavBar = () => {
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <NavBar
      title={
        <div className={styles.title}>
          <FormattedMessage id="ACCOUNT.TYPE.RECEIVE" />
        </div>
      }
      leftElement={
        <div className={styles.leftBox}>
          <img src={IconBack} className={styles.backIcon} onClick={goBack} alt="" />
        </div>
      }
    />
  );
};

export default memo(ReceiveNavBar);
