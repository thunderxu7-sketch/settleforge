import { FC, memo } from 'react';

import ProgressNode from './ProgressNode';
import { PageDeviceStatusType } from '../types';

import styles from '../LedgerImportGuidePage.m.scss';

interface Props {
  deviceStatus: PageDeviceStatusType;
  isConnecting: boolean;
}

const ProgressBar: FC<Props> = ({ deviceStatus, isConnecting }) => {
  return (
    <div className={styles.progressBar}>
      <div className={styles.crossLine} />

      <ProgressNode
        isProgressing={deviceStatus == 'UNKNOWN'}
        isDone={
          deviceStatus == 'LOCKED' || deviceStatus == 'UNAUTHORIZED' || deviceStatus == 'AUTHORIZED'
        }
      />
      <ProgressNode
        isProgressing={deviceStatus == 'LOCKED'}
        isDone={deviceStatus == 'UNAUTHORIZED' || deviceStatus == 'AUTHORIZED'}
      />
      <ProgressNode
        isProgressing={deviceStatus == 'UNAUTHORIZED'}
        isDone={deviceStatus == 'AUTHORIZED'}
      />
    </div>
  );
};

export default memo(ProgressBar);
