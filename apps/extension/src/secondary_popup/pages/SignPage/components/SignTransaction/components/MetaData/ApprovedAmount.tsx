import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import _ from 'lodash';
import { BigNumber } from '../../../../../../../popup/utils/numberUtils';
import { BigNumberType } from '../../../../../../../constants/types';

import styles from '../../../../static/scss/common.m.scss';

const MAX_AMOUNT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

interface Props {
  amount: string | number | BigNumberType;
  isBiggest: boolean;
  tokenInfo: any;
}
const ApprovedAmount: FC<Props> = ({ amount, isBiggest, tokenInfo }) => {
  const { formatMessage } = useIntl();
  const decimal = _.get(tokenInfo, 'precision', 0);
  if (new BigNumber(amount).eq(new BigNumber(MAX_AMOUNT))) {
    isBiggest = true;
  }
  amount = new BigNumber(amount).shiftedBy(-decimal).toFormat();
  const amoutFormat = isBiggest
    ? formatMessage({ id: 'CONFIRMATIONS.APPROVE.BALANCE_BIGGEST' })
    : amount;
  return (
    <div className={styles.item}>
      <div className={styles.title}>
        <FormattedMessage id={'CONFIRMATIONS.APPROVE.BALANCE'} />
      </div>
      {tokenInfo && <div className={styles.content}>{amoutFormat}</div>}
    </div>
  );
};

export default ApprovedAmount;
