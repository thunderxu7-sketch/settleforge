import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { BigNumber } from 'bignumber.js';

import { formatNumber } from '../../../../popup/utils/numberUtils';

import styles from '../ConnectWebsitePage.m.scss';

interface Props {
  name: string;
  address: string;
  amount: BigNumber | number;
}

const AddressInfo: FC<Props> = ({ name, address, amount }) => {
  return (
    <div className={styles.addressInfoContainer}>
      <div className={styles.title}>
        <FormattedMessage id="APPROVE_ACCOUNT.CONNECT_ACCOUNT.TIP" />
      </div>

      <div className={classNames(styles.addressBox, 'col')}>
        <div className={classNames(styles.topPart, 'row', 'center', 'spaceBetween')}>
          <div className={styles.name}>{name}</div>
          <div className={styles.balance}>{`${formatNumber(amount, {
            dp: 6,
            cutZero: true,
          })} TRX`}</div>
        </div>

        <div className={styles.address}>{address}</div>
      </div>

      <div className={styles.warningTipContainer}>
        <div className={classNames(styles.warningTip, 'row', 'center')}>
          <div className={styles.warningCircle} />
          <FormattedMessage id="APPROVE_ACCOUNT.TRUST.TIP" />
        </div>
        <div className={classNames(styles.warningTip, 'row', 'center')}>
          <div className={styles.warningCircle} />
          <FormattedMessage id="APPROVE_ACCOUNT.TRUST.TIP2" />
        </div>
      </div>
    </div>
  );
};

export default memo(AddressInfo);
