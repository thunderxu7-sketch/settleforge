import { FC, memo } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';

import { cutMiddle } from '../../../../utils';

import styles from '../TokenTransferListPage.m.scss';

interface Props {
  item: any;
  selectedAddress: string;

  navigateToTransferDetail: (txId: string, record:any) => void;
}

const CollectionTransferItem: FC<Props> = ({ item, selectedAddress, navigateToTransferDetail }) => {
  const { transaction_id, from_address, to_address, block_ts, quant, contractRet, local } = item;
  const isSend = selectedAddress === from_address;
  const formatAddress = isSend ? cutMiddle(to_address, 6, 6) : cutMiddle(from_address, 6, 6);

  return (
    <div
      className={classNames(styles.collectionTransferItem, local && styles.local)}
      onClick={() => {
        !local && navigateToTransferDetail(transaction_id, item);
      }}
    >
      <div className={styles.info}>
        <p>
          {isSend ? (
            <span className={styles.send}>
              <FormattedMessage id="ACCOUNT.TYPE.SEND_COLLECTION" />
            </span>
          ) : (
            <span className={styles.receive}>
              <FormattedMessage id="ACCOUNT.RECEIVE" />
            </span>
          )}
          <span className={styles.address}>
            {`(${isSend ? 'To：' + formatAddress : 'From：' + formatAddress})`}
          </span>
        </p>
        <p className={styles.time}>{dayjs(block_ts).format('YYYY-MM-DD HH:mm:ss')}</p>
      </div>

      <div className={styles.assetId}>
        {`# ${formatTrc721AssetFiled(quant)}`}
        {local ? (
          <span className={classNames(styles.transactionStatus, styles.confirm)}>
            <FormattedMessage id="TRANSACTIONS.CONFIRMING" />
          </span>
        ) : contractRet && contractRet.toLowerCase() !== 'success' ? (
          <span className={classNames(styles.transactionStatus, styles.fail)}>
            <FormattedMessage id="TRANSACTIONS.FAILED" />
          </span>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default memo(CollectionTransferItem);

function formatTrc721AssetFiled(elem: string, splitLen = 5) {
  return typeof elem === 'string' && _.size(elem) > splitLen * 2
    ? cutMiddle(elem, splitLen, splitLen)
    : elem;
}
