import { FormattedMessage } from 'react-intl';

import iconApprove from '../../../../../static/images/icon-approve.svg';

import styles from '../../../../../static/scss/common.m.scss';

const TokenDescriptor = () => {
  return (
    <div className={styles.tokenDes}>
      <div className="logo">
        <img src={iconApprove} alt="" />
      </div>
      <div className={styles.desText}>
        <FormattedMessage id={'CONFIRMATIONS.NEW.FUNCTION.APPROVE'} />
      </div>
    </div>
  );
};

export default TokenDescriptor;
