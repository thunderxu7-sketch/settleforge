import { memo } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from '../LoginPage.m.scss';

import loginBg from '../images/login-bg.gif';

const Header = () => {
  return (
    <>
      <img src={loginBg} className={styles.loginBg} alt="" />

      <div className={styles.welcomeLabel}>
        <FormattedMessage id="LOGIN.PASSWORD.BACK" />
      </div>
    </>
  );
};

export default memo(Header);
