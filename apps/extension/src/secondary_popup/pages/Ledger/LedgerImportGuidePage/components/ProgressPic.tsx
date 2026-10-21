import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import connectLedgerImage from '../images/connectLedger.gif';
import confirmEnImage from '../images/confirm_en.gif';
import confirmCnImage from '../images/confirm_cn.gif';
import confirmJpImage from '../images/confirm_jp.gif';
import openTronAppImage from '../images/open_tron_app.gif';
import { useSelectedLanguage } from '../../../../../hooks/language';
import type { PageDeviceStatusType } from '../types';

import styles from '../LedgerImportGuidePage.m.scss';

interface Props {
  deviceStatus: PageDeviceStatusType;
}

const ProgressPic: FC<Props> = ({ deviceStatus }) => {
  const { langAbbr } = useSelectedLanguage();

  let confirmImage = confirmCnImage;
  if (langAbbr == 'en') {
    confirmImage = confirmEnImage;
  } else if (langAbbr == 'jp') {
    confirmImage = confirmJpImage;
  }

  if (deviceStatus == 'UNKNOWN') {
    return (
      <div className={styles.picContainerStep1}>
        <img src={connectLedgerImage} className={styles.connectLedgerImage} alt="" />

        <div className={styles.infoStep1}>
          <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_1.INTRO" />
        </div>
      </div>
    );
  } else if (deviceStatus == 'LOCKED') {
    return (
      <div className={styles.picContainerStep2}>
        <img src={confirmImage} className={styles.confirmImage} alt="" />
        <div className={styles.infoStep2}>
          <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.INTRO" />
        </div>
      </div>
    );
  } else if (deviceStatus == 'UNAUTHORIZED' || deviceStatus == 'AUTHORIZED') {
    return (
      <div className={styles.picContainerStep3}>
        <img src={openTronAppImage} className={styles.openTronAppImage} alt="" />

        <div className={styles.infoStep3}>
          <FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_3.INTRO" />
        </div>
      </div>
    );
  }
  return <></>;
};

export default memo(ProgressPic);
