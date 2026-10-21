import { FC, memo } from 'react';

import finishIcon from '../images/icon-progress-finish.svg';

import styles from '../LedgerImportGuidePage.m.scss';

interface Props {
  isProgressing?: boolean;
  isDone?: boolean;
}

const ProgressNode: FC<Props> = ({ isProgressing = false, isDone = false }) => {
  if (isDone) {
    return <img src={finishIcon} className={styles.finishIcon} alt="" />;
  } else if (isProgressing) {
    return (
      <div className={styles.progressNode}>
        <div className={styles.centerCircle} />
      </div>
    );
  } else {
    return <div className={styles.progressNode} />;
  }
};

export default memo(ProgressNode);
