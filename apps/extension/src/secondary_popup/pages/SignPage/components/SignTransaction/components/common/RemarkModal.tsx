import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
// import BigNumber from 'bignumber.js';
import { formatNumber, BigNumber } from '../../../../../../../popup/utils/numberUtils';
import styles from '../../../../static/scss/common.m.scss';
interface Props {
  remarks: string;
  hideModal: () => void;
}
const VoteModal: FC<Props> = ({ remarks, hideModal }) => {
  return (
    <div className={styles.confirmModalWrap}>
      <div className={styles.confirmModalBody}>
        <div className={styles.remarkContent}>
          <div className={styles.titleWrap}>
            <div className={styles.title}>
              <FormattedMessage id={'CONFIRMATIONS.SEND.NOTE'} />
            </div>
          </div>
          <div className={styles.contentWrap}>{remarks}</div>
        </div>
        <div
          className={styles.closeBtn}
          onClick={(e) => {
            e.stopPropagation();
            hideModal && hideModal();
          }}
        />
      </div>
    </div>
  );
};

export default VoteModal;
