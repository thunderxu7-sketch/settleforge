import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import _ from 'lodash';
import styles from '../../../../static/scss/common.m.scss';
import classNames from 'classnames';

interface Props {
  superNodeInfo: Array<any>;
  showVoteModal: () => void;
}
const VoteTarget: FC<Props> = ({ superNodeInfo, showVoteModal }) => {
  const intl = useIntl();

  const size = _.size(superNodeInfo);
  const name = _.get(superNodeInfo, '0.name', _.get(superNodeInfo, '1.name'));

  const data = intl.formatMessage({ id: 'CONFIRMATIONS.VOTE.LIST_NAME' }, { name, size });
  const loadingSuperNode = false;
  return (
    <div
      className={classNames(styles.item, styles.mt15)}
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        showVoteModal();
      }}
    >
      <div className={styles.title}>
        <FormattedMessage id="CONFIRMATIONS.VOTE.TARGET" />
      </div>
      <div className={styles.content}>
        {loadingSuperNode ? (
          <div className="loadingFee" />
        ) : (
          <div className={styles.afterBtn} title={data}>
            {data}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteTarget;
