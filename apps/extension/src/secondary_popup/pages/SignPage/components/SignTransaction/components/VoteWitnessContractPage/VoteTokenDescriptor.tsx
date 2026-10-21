import { FormattedMessage } from 'react-intl';

import iconVote from '../../../../static/images/icon-vote.svg';

import styles from '../../../../static/scss/common.m.scss';

const VoteTokenDescriptor = () => {
  return (
    <div className={styles.tokenDes}>
      <div className="logo">
        <img src={iconVote} alt="" />
      </div>
      <div className={styles.desText}>
        <FormattedMessage id={'CONFIRMATIONS.NEW.FUNCTION.VOTE'} />
      </div>
    </div>
  );
};

export default VoteTokenDescriptor;
