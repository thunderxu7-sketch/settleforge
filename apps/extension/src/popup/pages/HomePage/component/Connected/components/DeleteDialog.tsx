import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from '../Connected.m.scss';

interface Props {
  hostname?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteDialog: FC<Props> = ({ hostname, onCancel, onConfirm }) => {
  const intl = useIntl();

  return (
    <div className={styles.deleteContainer}>
      <div
        dangerouslySetInnerHTML={{
          __html: intl.formatMessage(
            {
              id: 'ACCOUNT.AUTH_WEBSITE.ADDRESS.DISCONNECT',
            },
            {
              site: hostname,
              span: (chunks) => `<span class='${styles.connectedCountColor}'>${chunks.join('')}</span>`,
            },
          ),
        }}
        className={styles.deleteTitle}
      />

      <div className={styles.dialogButtons}>
        <button onClick={onCancel} className={styles.cancelButton}>
          <FormattedMessage id="BUTTON.CANCEL" />
        </button>

        <button onClick={onConfirm} className={styles.confirmButton}>
          <FormattedMessage id="BUTTON.CONFIRM" />
        </button>
      </div>
    </div>
  );
};

export default memo(DeleteDialog);
