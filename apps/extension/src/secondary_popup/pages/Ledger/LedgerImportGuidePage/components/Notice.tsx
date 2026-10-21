import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { PageDeviceStatusType } from '../types';

import styles from '../LedgerImportGuidePage.m.scss';

interface Props {
  deviceStatus: PageDeviceStatusType;
  isRetry: boolean;
  isSwitchVisible: boolean;
  onClickSwitch: () => void;
}

const Notice: FC<Props> = ({ deviceStatus, isRetry, isSwitchVisible, onClickSwitch }) => {
  const intl = useIntl();

  if (deviceStatus == 'LOCKED') {
    return (
      <div className={styles.noticeContainer}>
        <div
          className={styles.noticeTitle}
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage({ id: 'WALLET.LEDGER.CONNECT.STEP_2.WARN' }),
          }}
        />
        <ul>
          <li>
            <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.WARNLIST_1" />
          </li>
          <li>
            <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.WARNLIST_2" />
          </li>
          <li>
            <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.WARNLIST_3" />
          </li>
          <li>
            <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.WARNLIST_4" />
          </li>
          <li>
            <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.WARNLIST_5" />
            {isSwitchVisible && (
              <a onClick={onClickSwitch}>
                <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.CHECK_LEDGER_TYPE" />
              </a>
            )}
          </li>
        </ul>
      </div>
    );
  } else if (isRetry && deviceStatus == 'UNAUTHORIZED') {
    return (
      <div className={styles.noticeContainer}>
        <div
          className={styles.warning}
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage({ id: 'WALLET.LEDGER.CONNECT.STEP_3.WARN' }),
          }}
        />
      </div>
    );
  }

  return <div className={styles.noticeContainer} />;
};

export default memo(Notice);
