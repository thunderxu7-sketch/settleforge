import { FormattedMessage } from 'react-intl';

import iconUnFreeze from '../../../../static/images/icon-unfreeze.svg';

import styles from '../../../../static/scss/common.m.scss';

const UnFreezeTokenDescriptor = () => {
  return (
    <div className={styles.tokenDes}>
      <div className="logo">
        <img src={iconUnFreeze} alt="" />
      </div>
      <div className={styles.desText}>
        <FormattedMessage id={'CONFIRMATIONS.NEW.FUNCTION.UNFREEZE'} />
      </div>
    </div>
  );
};

export default UnFreezeTokenDescriptor;
