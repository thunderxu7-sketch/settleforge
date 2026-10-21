import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import styles from '../LedgerConfirmPage.m.scss';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  type: number;
}

const LedgerConfirmModal: FC<Props> = ({ visible, onCancel, onSubmit, type }) => {
  return visible ? (
    <div className={styles.modalWrap}>
      <div className={styles.modal}>
        <div className={styles.title}>
          <FormattedMessage
            id={type === 1 ? 'WALLET.LEDGER.TIMEOUT.TITLE' : 'WALLET.LEDGER.RETRY.TITLE'}
          />
        </div>
        <div className={styles.desc}>
          <FormattedMessage
            id={
              type === 1
                ? 'WALLET.LEDGER.TIMEOUT.COMMON_CONTENT'
                : 'WALLET.LEDGER.RETRY.COMMON_CONTENT'
            }
          />
        </div>
        <div className={styles.btnGroup}>
          <button className={styles.cancel} onClick={onCancel}>
            <FormattedMessage id={'BUTTON.CANCEL'} />
          </button>
          <button className={styles.confirm} onClick={onSubmit}>
            <FormattedMessage id={'CREATION.LEDGER.CHOOSE_ADDRESS.RETRY'} />
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default memo(LedgerConfirmModal);
