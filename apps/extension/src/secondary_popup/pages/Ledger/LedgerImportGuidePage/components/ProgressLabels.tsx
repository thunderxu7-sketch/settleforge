import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import type { PageDeviceStatusType } from '../types';

import styles from '../LedgerImportGuidePage.m.scss';

interface Props {
  deviceStatus: PageDeviceStatusType;
}

const ProgressLabels: FC<Props> = ({ deviceStatus }) => {
  return (
    <div className={styles.progressLabels}>
      {deviceStatus == 'UNKNOWN' && (
        <>
          <div className={styles.label1}>
            <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_1.TITLE" />
          </div>
          <div className={styles.label2}>
            <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_1.TIPS" />
          </div>
        </>
      )}

      {deviceStatus == 'LOCKED' && (
        <div className={styles.label1}>
          <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.TITLE" />
        </div>
      )}

      {(deviceStatus == 'UNAUTHORIZED' || deviceStatus == 'AUTHORIZED') && (
        <div className={styles.label1}>
          <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_3.TITLE" />
        </div>
      )}
    </div>
  );
};

export default memo(ProgressLabels);
