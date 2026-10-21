import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';

import { formatNumber, BigNumber } from '../../../../../../../popup/utils/numberUtils';

import styles from '../../../../static/scss/common.m.scss';
interface Props {
  type: 'FREEZE' | 'UNFREEZE';
  balance: BigNumber | number | string;
}

const FreezeTronPower: FC<Props> = ({ type, balance }) => {
  return (
    <div className={styles.item}>
      <div className={styles.title}>
        <FormattedMessage id={`CONFIRMATIONS.${type}.REMOVE_VOTES`} />
      </div>
      <div className={styles.content}>
        {formatNumber(balance, { cutZero: true })}{' '}
        {<FormattedMessage id="CONFIRMATIONS.RESOURCE.VOTE" />}
      </div>
    </div>
  );
};

export default FreezeTronPower;
