import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'antd';

import styles from './ApproveAddressModal.m.scss';

interface Props {
  showApproveAddressModal: boolean;

  onClose: () => void;
  onConfirm: () => void;
}

const getContainerFunc: () => HTMLElement = () => {
  return document.querySelector('#approveAddressModal') ?? document.body;
};
const ApproveAddressModal: FC<Props> = ({ showApproveAddressModal, onConfirm, onClose }) => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.approveAddressModal} id="approveAddressModal">
      <Modal
        visible={showApproveAddressModal}
        okText={formatMessage({ id: 'BUTTON.CONFIRM2' })}
        cancelText={formatMessage({ id: 'BUTTON.CANCEL' })}
        onOk={onConfirm}
        onCancel={onClose}
        closable={false}
        getContainer={getContainerFunc}
      >
        <h3 className={styles.overview}>
          <FormattedMessage id="SIGN.APPROVE.ACCOUNT.RISK" />
        </h3>

        <div className={styles.detail}>
          <div>
            <FormattedMessage id="SIGN.APPROVE.ACCOUNT.CONFIRM" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default memo(ApproveAddressModal);
