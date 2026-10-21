import { FormattedMessage } from 'react-intl';

import iconMessage from '../../../static/images/icon-message.svg';
import styles from '../../../static/scss/common.m.scss';

const TokenDescriptor = () => {
  return (
    <div className={styles.tokenDes}>
      <div>
        <img src={iconMessage} alt="" className={styles.desLogo} />
      </div>
      <div className={styles.desText}>
        <FormattedMessage id="CONTRACTS.MessageSignature" />
      </div>
    </div>
  );
};

export default TokenDescriptor;
