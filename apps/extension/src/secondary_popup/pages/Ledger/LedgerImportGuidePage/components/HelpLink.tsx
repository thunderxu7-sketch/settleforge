import { FC, memo } from 'react';
import { useIntl } from 'react-intl';

import type { PageDeviceStatusType } from '../types';

import styles from '../LedgerImportGuidePage.m.scss';

interface Props {
  deviceStatus: PageDeviceStatusType;
}

const HelpLink: FC<Props> = ({ deviceStatus }) => {
  const intl = useIntl();

  const id =
    deviceStatus == 'UNAUTHORIZED' || deviceStatus == 'AUTHORIZED'
      ? 'WALLET.LEDGER.CONNECT.STEP_3.HELP'
      : 'WALLET.LEDGER.CONNECT.STEP_1.HELP';

  return (
    <div className={styles.helpLinkContainer}>
      <div
        dangerouslySetInnerHTML={{
          __html: intl.formatMessage({ id }),
        }}
      />
    </div>
  );
};

export default memo(HelpLink);
