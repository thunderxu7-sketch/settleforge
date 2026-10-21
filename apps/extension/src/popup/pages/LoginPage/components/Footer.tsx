import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import styles from '../LoginPage.m.scss';

interface Props {
  loginByOtherWay: () => void;
  createNewWallet: () => void;
}

const Footer: FC<Props> = ({ loginByOtherWay, createNewWallet }) => {
  return (
    <div className={classNames(styles.footer, 'col')}>
      <div className={styles.tip}>
        <FormattedMessage id="WALLET.LOGIN.QUESTION.TIP" />
      </div>

      <div className={classNames(styles.linkWrap, 'row')}>
        <div className={styles.link} onClick={loginByOtherWay}>
          <FormattedMessage id="WALLET.LOGIN.OTHER_WAY" />
        </div>
        &nbsp;
        <FormattedMessage id="WALLET.LOGIN.OR" />
        &nbsp;
        <div className={styles.link} onClick={createNewWallet}>
          <FormattedMessage id="WALLET.LOGIN.CREATE_NEW_WALLET" />
        </div>
      </div>
    </div>
  );
};

export default memo(Footer);
