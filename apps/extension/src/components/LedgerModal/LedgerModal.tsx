import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'antd';

import styles from './LedgerModal.m.scss';

interface Props {
  ledgerTips: string;
  showLedgerLoading: boolean;

  closeLedgerLoadingModal: () => void;
}
const LedgerModal: FC<Props> = ({ ledgerTips, showLedgerLoading, closeLedgerLoadingModal }) => {
  const { formatMessage } = useIntl();
  return (
    <div className={styles.ledgerModal} id="ledgerModal">
      <Modal
        cancelText={formatMessage({ id: 'BUTTON.CANCEL' })}
        onCancel={() => {
          closeLedgerLoadingModal();
        }}
        closable={false}
        visible={showLedgerLoading}
        getContainer={() => {
          return document.querySelector('#ledgerModal') ?? document.body;
        }}
      >
        {ledgerTips && ledgerTips.length > 0 ? (
          <div className={styles.ledgerTips}>
            {
              <FormattedMessage
                id={ledgerTips}
                values={{ strong: (value: any) => <span>{value}</span> }}
              />
            }
          </div>
        ) : (
          <>
            <h3 className={styles.overview}>
              <FormattedMessage id="CREATION.LEDGER.LOADING.CONFIRM" />
            </h3>
            <div className={styles.detail}></div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default LedgerModal;
