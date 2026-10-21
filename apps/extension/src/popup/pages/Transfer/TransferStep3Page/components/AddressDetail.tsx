import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import { cutMiddle } from '../../../../utils';

import styles from '../TransferStep3Page.m.scss';

import pathIcon from '../images/icon-transfer-path.svg';

interface Props {
  fromAddress: string;
  fromName: string;
  toAddress: string;
  toName: string;
  id: string;
  contractAddress: string;
  hostname: string;
  shortName: string;
  type: number;
}
const AddressDetail: FC<Props> = ({
  fromAddress,
  fromName,
  toAddress,
  toName,
  id,
  contractAddress,
  hostname,
  shortName,
  type,
}) => {
  return (
    <div className={styles.addressDetail}>
      <div className={styles.accountInfo}>
        <div className={styles.fromAddress}>
          <h3 className={styles.title}>
            <FormattedMessage id="CONFIRMATIONS.TRANSFER.FROM" />
          </h3>
          <p className={styles.address}>{cutMiddle(fromAddress, 6, 6)}</p>
          <p className={styles.name}>{fromName}</p>
        </div>
        <div className={styles.path}>
          <img src={pathIcon} alt="" />
        </div>
        <div className={styles.toAddress}>
          <h3 className={styles.title}>
            <FormattedMessage id="CONFIRMATIONS.NEW.RECIPIENT" />
          </h3>
          <p className={styles.address}>{cutMiddle(toAddress, 6, 6)}</p>
          <p className={styles.name}>{toName}</p>
        </div>
      </div>

      {id && type !== 5 && (
        <div className={styles.contractInfo}>
          <p className={styles.title}>
            <FormattedMessage id="ASSET.ASSET.ID" />
          </p>
          <div>
            <p
              className={styles.contractAddress}
              onClick={(e) => {
                e.stopPropagation();
                const url = `${hostname}/token/${id}`;
                window.open(url);
              }}
            >
              {id}
            </p>
          </div>
        </div>
      )}

      {contractAddress && (
        <div className={styles.contractInfo}>
          <p className={styles.title}>
            <FormattedMessage id="CONFIRMATIONS.TITLE.CONTRACT" />
          </p>
          <div>
            <p
              className={styles.contractAddress}
              onClick={(e) => {
                e.stopPropagation();
                const url = `${hostname}/token20/${contractAddress}`;
                window.open(url);
              }}
            >
              <span>
                <i>SC</i>
              </span>
              {cutMiddle(contractAddress, 6, 6)}
            </p>
            <p className={styles.contractName}>{shortName} Token</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AddressDetail);
