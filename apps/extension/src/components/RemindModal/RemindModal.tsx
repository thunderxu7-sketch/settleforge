import { FC, memo } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

import styles from './RemindModal.m.scss';

interface Props {
  isVisible: boolean;
  type: 1 | 2;
  onCancel: () => void;
  onConfirm: () => void;
}

const RemindModal: FC<Props> = ({ isVisible, type, onCancel, onConfirm }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <div className={styles.title}>
          <FormattedMessage id="WALLET.BACKUP.WARN.TITLE" />
        </div>

        <div className={styles.descContainer}>
          {type == 1 && (
            <div className={styles.desc}>
              <FormattedMessage id="WALLET.BACKUP.WARN.TIPS" />
            </div>
          )}

          {type == 2 && (
            <>
              <div className={styles.multilineContainer}>
                <div className={styles.circle} />
                <div className={styles.desc}>
                  <FormattedMessage id="WALLET.BACKUP.WARN.TIPS" />
                </div>
              </div>
              <div className={classNames(styles.multilineContainer, styles.multiline2)}>
                <div className={styles.circle} />
                <div className={styles.desc}>
                  <FormattedMessage id="WALLET.BACKUP.WARN.TIPS2" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.buttonContainer}>
          <div onClick={onCancel} className={classNames(styles.button, styles.cancelButton)}>
            <FormattedMessage id="BUTTON.CANCEL" />
          </div>

          <div onClick={onConfirm} className={classNames(styles.button, styles.confirmButton)}>
            <FormattedMessage id="WALLET.BACKUP.WARN.BUTTON.TITLE" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(RemindModal);
