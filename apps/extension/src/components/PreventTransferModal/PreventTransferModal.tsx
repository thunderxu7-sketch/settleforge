import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'antd';

import styles from './PreventTransferModal.m.scss';

interface Props {
  showModal: boolean;

  setShowModal: (isShow: boolean) => void;
}
const PreventTransferModal: FC<Props> = ({ showModal, setShowModal }) => {
  const { formatMessage } = useIntl();
  return (
    <div className={styles.preventTransferModal} id="preventTransferModal">
      <Modal
        visible={showModal}
        closable={false}
        okText={formatMessage({ id: 'BUTTON.CONFIRM2' })}
        onOk={() => {
          setShowModal(false);
        }}
        getContainer={() => {
          return document.querySelector('#preventTransferModal') ?? document.body;
        }}
      >
        <div className={styles.modalText}>
          <FormattedMessage id="ALERT.ACTIVATION.ACCOUNT" />
        </div>
      </Modal>
    </div>
  );
};

export default PreventTransferModal;
