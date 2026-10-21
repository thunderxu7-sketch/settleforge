import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';

import { cutMiddle } from '../../../../../../../popup/utils';

import styles from '../../../../static/scss/common.m.scss';
interface Props {
  type: 'FREEZE' | 'UNFREEZE';
  toAddress: string;
}
const FreezeResourceAddress: FC<Props> = ({ type, toAddress }) => {
  return (
    <div className={styles.item}>
      <div className={styles.title}>
        <FormattedMessage id={`CONFIRMATIONS.${type}.ADDRESS`} />
      </div>
      <div className={styles.content}>{cutMiddle(toAddress)}</div>
    </div>
  );
};

export default FreezeResourceAddress;
