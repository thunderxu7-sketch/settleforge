import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './MultiSignNotice.m.scss';

import closeIcon from '../../images/close2.svg';

interface Props {
  isVisible: boolean;
  multiSignCount: number;
  onClose: (openJump: boolean) => void;
}

const MultiSignNotice: FC<Props> = ({ isVisible, multiSignCount, onClose }) => {
  if (!isVisible || multiSignCount == 0) {
    return null;
  }

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <img onClick={() => onClose(false)} src={closeIcon} className={styles.closeIcon} alt="" />

        <div className={styles.noticeLabelContainer}>
          <div className={styles.noticeLabel}>
            <FormattedMessage id="MULTI_SIGN.PENDING_TRANSACTION" />
          </div>

          <div className={styles.badge}>{multiSignCount < 100 ? multiSignCount : '99+'}</div>
        </div>

        <div onClick={() => onClose(true)} className={styles.confirmButton}>
          <FormattedMessage id="NOTIFICATIONS.MULTI_SIGN_BTN_TEXT" />
        </div>
      </div>
    </div>
  );
};

export default memo(MultiSignNotice);
