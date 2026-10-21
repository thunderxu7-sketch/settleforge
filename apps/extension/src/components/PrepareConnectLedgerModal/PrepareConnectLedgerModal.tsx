import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'antd';

import styles from './PrepareConnectLedgerModal.m.scss';

interface Props {
  showPrepareConnectLedger: boolean;

  onClose: () => void;
  onConfirm: () => void;
}
const PrepareConnectLedgerModal: FC<Props> = ({ showPrepareConnectLedger, onConfirm, onClose }) => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.prepareConnectLedger} id="prepareConnectLedger">
      <Modal
        visible={showPrepareConnectLedger}
        okText={formatMessage({ id: 'WALLET.LEDGER.PREPARE_CONNECT.CONFIRM' })}
        cancelText={formatMessage({ id: 'BUTTON.CANCEL' })}
        onOk={() => {
          onConfirm();
        }}
        onCancel={() => {
          onClose();
        }}
        closable={false}
        getContainer={() => {
          return document.querySelector('#prepareConnectLedger') ?? document.body;
        }}
      >
        <h3 className={styles.overview}>
          <FormattedMessage id="WALLET.LEDGER.PREPARE_CONNECT.TITLE" />
        </h3>

        <div className={styles.detail}>
          <p>
            <FormattedMessage id="WALLET.LEDGER.PREPARE_CONNECT.CONTENT" />
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default PrepareConnectLedgerModal;
