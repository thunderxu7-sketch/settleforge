import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';

import { formatNumber, BigNumber } from '../../../../../../../popup/utils/numberUtils';
import styles from '../../../../static/scss/common.m.scss';
interface Props {
  costs: { [key: string]: any };
  hideModal: () => void;
}
const VoteModal: FC<Props> = ({ costs, hideModal }) => {
  const { createAccountUseTrx = 0, contractUseTrx = 0 } = costs || {};
  const useTrx = new BigNumber(createAccountUseTrx).plus(contractUseTrx);
  return (
    <div className={styles.confirmModalWrap}>
      <div className={styles.confirmModalBody}>
        <div className={styles.feeContent}>
          <div className={styles.titleWrap}>
            <div className={styles.title}>
              <FormattedMessage id={'CONFIRMATIONS.SEND.FEE'} />
              &nbsp;
              <FormattedMessage id={'CONFIRMATIONS.TITLE.PRE_CALCULATION'} />
            </div>
            <div className={styles.amount}>
              {formatNumber(useTrx, { dp: 6, cutZero: true })} TRX
            </div>
          </div>
          <div className={styles.contentWrap}>
            {_.get(costs, 'contractUseTrx', 0) > 0 && (
              <div className={styles.item}>
                <div className={styles.title}>
                  <FormattedMessage id={'CONFIRMATIONS.RESOURCE.USE_TRX'} />
                </div>
                <div className={styles.amount}>
                  {formatNumber(_.get(costs, 'contractUseTrx', 0), { dp: 6, cutZero: true })}TRX
                </div>
              </div>
            )}
          </div>
          <div className="tip">
            <FormattedMessage id={'CONFIRMATIONS.RESOURCE.NOT_ENOUGH_USE_TRX'} />
          </div>
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
