import { FC, useState } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import _ from 'lodash';
// import BigNumber from 'bignumber.js';

import { formatNumber, BigNumber } from '../../../../../../../popup/utils/numberUtils';
import FeeModal from '../common/FeeModal';
import ErrorIcon from '../../../../static/images/icon-error.svg';
import styles from '../../../../static/scss/common.m.scss';

interface Props {
  costs: { [key: string]: any };
}

const FeeMeta: FC<Props> = ({ costs }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const title =
    formatMessage({ id: 'CONFIRMATIONS.SEND.FEE' }) +
    ' ' +
    formatMessage({ id: 'CONFIRMATIONS.TITLE.PRE_CALCULATION' });

  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const { trxEnough = true, createAccountUseTrx = 0, contractUseTrx = 0 } = costs || {};

  const useTrx = new BigNumber(createAccountUseTrx).plus(contractUseTrx);

  return (
    useTrx.gt(0) && (
      <div className={styles.item}>
        <div className={styles.title}>{title}</div>
        <div
          className={styles.content}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            openModal();
          }}
        >
          <>
            <div
              className={styles.afterBtn}
              title={`${formatNumber(useTrx, { dp: 6, cutZero: true })} TRX`}
            >
              {formatNumber(useTrx, { dp: 6, cutZero: true })} TRX
            </div>
            {!trxEnough && (
              <div className={styles.warningTip}>
                <img alt="" src={ErrorIcon} />
                <FormattedMessage id={'CONFIRMATIONS.BALANCE.NOT_ENOUGH'} />
              </div>
            )}
          </>
        </div>
        {modalVisible && <FeeModal costs={costs} hideModal={hideModal} />}
      </div>
    )
  );
};

export default FeeMeta;
