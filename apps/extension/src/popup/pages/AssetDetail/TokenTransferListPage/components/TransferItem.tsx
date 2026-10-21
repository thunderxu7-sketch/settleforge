import _ from 'lodash';
import dayjs from 'dayjs';
import { FC, memo } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

import { BigNumber, formatNumber } from '../../../../utils/numberUtils';
import { cutMiddle } from '../../../../utils';
import { AddressBookState } from '../../../../../store/slices/address_book';

import ResizableText from '../../../../../components/ResizableText';

import styles from '../TokenTransferListPage.m.scss';

interface Props {
  precision: number;
  record: any;
  addressBook: AddressBookState;
  selectedAddress: string;

  navigateToTransferDetail: (txId: string, record: any) => void;
}

const TransferItem: FC<Props> = ({
  precision,
  record,
  addressBook,
  selectedAddress,
  navigateToTransferDetail,
}) => {
  const { toAddress, fromAddress, amount, timestamp, hash, contract_ret, local, contractType } =
    record;
  const direction =
    toAddress === fromAddress ? 'send' : toAddress === selectedAddress ? 'receive' : 'send';

  let showName = toAddress === selectedAddress ? fromAddress : toAddress;
  if (addressBook[showName]) {
    showName = addressBook[showName].name;
  } else {
    showName = cutMiddle(showName, 6, 6);
  }

  let decimal = 6;
  const bigNumberAmount = new BigNumber(amount).shiftedBy(-precision);
  if (bigNumberAmount.lt(0.000001)) {
    decimal = 18;
  }
  const transferAmount = formatNumber(bigNumberAmount, {
    dp: decimal,
    cutZero: true,
  });

  return (
    <div
      className={classNames(styles.transferItem, local && styles.local)}
      onClick={() => {
        !local && navigateToTransferDetail(hash, record);
      }}
    >
      <div className={styles.transferInfo}>
        <p className={styles.transferName}>
          {showName ? (
            showName
          ) : contractType !== 'TransferContract' ? (
            <FormattedMessage id="TRANSACTIONS.SYSTEM_CONTRACT" />
          ) : (
            '-'
          )}
        </p>
        <p className={styles.transferTime}>{dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
      </div>
      <div className={styles.transferAmount}>
        <span className={classNames(direction === 'receive' ? styles.receive : styles.send)}>
          {direction === 'receive' ? '+' : '-'}
          <ResizableText initSize={14} text={transferAmount} />
        </span>
        <div>
          {local ? (
            <span className={classNames(styles.transactionStatus, styles.confirm)}>
              <FormattedMessage id="TRANSACTIONS.CONFIRMING" />
            </span>
          ) : contract_ret && contract_ret.toLowerCase() !== 'success' ? (
            <span className={classNames(styles.transactionStatus, styles.fail)}>
              <FormattedMessage id="TRANSACTIONS.FAILED" />
            </span>
          ) : (
            ''
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(TransferItem);
