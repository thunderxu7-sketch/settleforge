import { FormattedMessage } from 'react-intl';

import iconContract from '../../../../../static/images/icon-contract.svg';

import styles from '../../../../../static/scss/common.m.scss';

const FreezeTokenDescriptor = () => {
  return (
    <div className={styles.tokenDes}>
      <div className="logo">
        <img src={iconContract} alt="" />
      </div>
      <div className={styles.desText}>
        <FormattedMessage id={'CONFIRMATIONS.NEW.FUNCTION.TRIGGER_SMART_CONTRACT'} />
      </div>
    </div>
  );
};

export default FreezeTokenDescriptor;
