import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { formatNumber } from '../../../../../popup/utils/numberUtils';

import styles from '../TransferStep3Page.m.scss';

interface Props {
  useTrx: number | string;
  trxEnough: boolean;
  setShowCostDetail: (isShow: boolean) => void;
}
const CostDetail: FC<Props> = ({ useTrx, trxEnough, setShowCostDetail }) => {
  return (
    <div
      className={classNames(styles.costDetail, 'cursorPointer')}
      onClick={() => {
        setShowCostDetail(true);
      }}
    >
      <p className={styles.title}>
        <FormattedMessage id="CONFIRMATIONS.SEND.FEE" />
        <FormattedMessage id="CONFIRMATIONS.TITLE.PRE_CALCULATION" />
      </p>
      <div>
        <p className={styles.costAmount}>
          {`${formatNumber(useTrx, { dp: 6, cutZero: true })} TRX`} <i></i>
        </p>
        {!trxEnough && (
          <p className={styles.costWarn}>
            <i></i>
            <FormattedMessage id="CONFIRMATIONS.BALANCE.NOT_ENOUGH" />
          </p>
        )}
      </div>
    </div>
  );
};

export default memo(CostDetail);
