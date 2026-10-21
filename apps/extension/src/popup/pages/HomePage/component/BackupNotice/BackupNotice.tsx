import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './BackupNotice.m.scss';

interface Props {
  isVisible: boolean;
  onBackup: () => void;
}

const BackupNotice: FC<Props> = ({ isVisible, onBackup }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.backupWrap}>
      <div className={styles.container}>
        <div className={styles.title}>
          <FormattedMessage id="WALLET.BACKUP.WARN.TITLE" />
        </div>

        <div className={styles.content}>
          <FormattedMessage id="WALLET.BACKUP.WARN.TIPS" />
        </div>
        <div className={styles.btn} onClick={onBackup}>
          <FormattedMessage id="WALLET.BACKUP.WARN.BUTTON.TITLE" />
        </div>

        {/*<img src={CloseIcon} className={styles.closeIcon} alt="" />*/}
      </div>
    </div>
  );
};

export default memo(BackupNotice);
