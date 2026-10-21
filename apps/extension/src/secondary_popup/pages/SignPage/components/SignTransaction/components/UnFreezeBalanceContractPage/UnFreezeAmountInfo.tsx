import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
// import BigNumber from 'bignumber.js';

import { BigNumber } from '../../../../../../../popup/utils/numberUtils';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  frozenBalance: BigNumber | string;
  fromAddress: string;
  toAddress: string;
}
const UnFreezeAmountInfo: FC<Props> = ({ frozenBalance, fromAddress, toAddress }) => {
  return (
    <div className={styles.amountInfo}>
      {fromAddress === toAddress ? (
        <FormattedMessage
          id={'CONFIRMATIONS.UNFREEZE.OWNER_TIP'}
          values={{ amount: new BigNumber(frozenBalance).toFormat() }}
        />
      ) : (
        <FormattedMessage
          id={'CONFIRMATIONS.UNFREEZE.OTHERS_TIP'}
          values={{ amount: new BigNumber(frozenBalance).toFormat() }}
        />
      )}
    </div>
  );
};

export default UnFreezeAmountInfo;
