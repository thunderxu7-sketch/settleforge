import { FormattedMessage } from 'react-intl';

import iconFreeze from '../../../../static/images/icon-freeze.svg';

import styles from '../../../../static/scss/common.m.scss';

const FreezeTokenDescriptor = () => {
  return (
    <div className={styles.tokenDes}>
      <div className="logo">
        <img src={iconFreeze} alt="" />
      </div>
      <div className={styles.desText}>
        <FormattedMessage id={'CONFIRMATIONS.NEW.FUNCTION.FREEZE'} />
      </div>
    </div>
  );
};

export default FreezeTokenDescriptor;
