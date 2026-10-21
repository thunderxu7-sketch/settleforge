import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { WALLET_IMPORT_TYPE } from '../../constants/wallet_type';
import { cutMiddle, isDef } from '../../popup/utils';

import styles from './AccountRow.m.scss';

interface Props {
  importType?: string;
  address: string;
  path?: string;
  accountIndex?: number;
  addressIndex?: number;
  rowIndex?: number; // Used for numbers displayed in the lower right corner
  balance: string;
  isActive: boolean;
  isImported: boolean;
  onToggleItem?: (val: string) => void;
}

const AccountRow: FC<Props> = ({
  importType,
  address,
  path,
  accountIndex = 0,
  addressIndex = 0,
  rowIndex,
  balance,
  isActive,
  isImported,
  onToggleItem = () => null,
}) => {
  const isShowPath =
    importType && [WALLET_IMPORT_TYPE.MNEMONIC, WALLET_IMPORT_TYPE.LEDGER].includes(importType);

  return (
    <div
      className={classNames(styles.addressInfo, {
        [styles.active]: isActive,
        [styles.imported]: isImported,
      })}
      onClick={() => onToggleItem(address)}
    >
      <div className={classNames(styles.aiTitle, 'flex')}>
        <span>{cutMiddle(address)}</span>
        {isImported ? (
          <span className={styles.selectTxt}>
            <FormattedMessage id="WALLT.IMPORT.IMPORTED" />
          </span>
        ) : (
          <span className={styles.selectAddress} />
        )}
      </div>
      <div className={styles.aiBalance}>
        <FormattedMessage id="WALLT.IMPORT.BALANCE" /> {balance || 0} TRX
      </div>
      {isShowPath && (
        <>
          <div className={styles.aiPath}>
            Path: {path?.length ? path : `m/44'/195'/${accountIndex}'/0/${addressIndex}`}
          </div>
          {isDef(rowIndex) && <div className={styles.aiNum}>{rowIndex}</div>}
        </>
      )}
    </div>
  );
};

export default memo(AccountRow);
