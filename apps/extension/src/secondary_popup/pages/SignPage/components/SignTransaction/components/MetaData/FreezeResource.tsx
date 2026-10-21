import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  type: 'FREEZE' | 'UNFREEZE';
  resource: string;
}
const FreezeResource: FC<Props> = ({ type, resource }) => {
  const unit =
    resource === 'BANDWIDTH' ? 'CONFIRMATIONS.RESOURCE.BANDWIDTH' : 'CONFIRMATIONS.RESOURCE.ENERGY';
  return (
    <div className={styles.item}>
      <div className={styles.title}>
        <FormattedMessage id={`CONFIRMATIONS.${type}.RESOURCE`} />
      </div>
      <div className={styles.content}>
        <div className={styles.resource}>
          {/* {formatNumber(balance, { cutZero: true })}&nbsp; */}
          <FormattedMessage id={unit} />
        </div>
      </div>
    </div>
  );
};

export default FreezeResource;
