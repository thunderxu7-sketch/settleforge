import { FC } from 'react';
import { FormattedMessage } from 'react-intl';

import { cutMiddle } from '../../../../../../../popup/utils';

import iconArrowBold from '../../../../static/images/icon-arrow-bold.svg';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  fromAddress: string;
  toAddress: string;
  fromAddressName: string;
  toAddressName: string;
}
const FromToInfo: FC<Props> = ({ fromAddress, toAddress, fromAddressName, toAddressName }) => {
  return (
    <div className={styles.fromToInfo}>
      <div className={styles.addressWrap}>
        <div className={styles.title}>
          <FormattedMessage id="CONFIRMATIONS.TRANSFER.FROM" />
        </div>
        <div className={styles.address} title={fromAddress}>
          {cutMiddle(fromAddress)}
        </div>
        <div className={styles.name} title={fromAddressName}>
          {fromAddressName}
        </div>
      </div>
      <img className={styles.arrow} src={iconArrowBold} />
      <div className={styles.addressWrap}>
        <div className={styles.title}>
          <FormattedMessage id="CONFIRMATIONS.TRANSFER.TO" />
        </div>
        <div className={styles.address} title={toAddress}>
          {cutMiddle(toAddress)}
        </div>
        <div className={styles.name} title={toAddressName}>
          {toAddressName}
        </div>
      </div>
    </div>
  );
};

export default FromToInfo;
