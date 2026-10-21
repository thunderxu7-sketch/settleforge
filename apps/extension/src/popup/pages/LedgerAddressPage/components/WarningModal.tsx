import { FC, memo } from 'react';
import { Modal } from 'antd';
import { FormattedMessage } from 'react-intl';

import WarningImg from '../../../common/images/warning.svg';
import styles from '../LedgerAddressPage.m.scss';

interface Props {
  showModal: boolean;
  toggleModal: (event: React.MouseEvent<Element, MouseEvent>) => void;
  onConfirm: (event: React.MouseEvent<Element, MouseEvent>) => void;
}

const WarningModal: FC<Props> = ({ showModal, toggleModal, onConfirm }) => {
  return (
    <Modal
      visible={showModal}
      width={300}
      // height={365}
      // maskClosable={false}
      className={styles.addressModal}
    >
      <div className={styles.addressHeader}>
        <div>
          <FormattedMessage id="WALLT.IMPORT.RISK_TIP" />
        </div>
      </div>
      <p className={styles.addressDes}>
        <img src={WarningImg} alt="" />
        <FormattedMessage id="WALLT.IMPORT.RISK_CONTENT_1" />
      </p>
      <p className={styles.addressDes}>
        <img src={WarningImg} alt="" />
        <FormattedMessage id="WALLT.IMPORT.RISK_CONTENT_2" />
      </p>
      <div className={styles.continue} onClick={onConfirm}>
        <FormattedMessage id="WALLT.IMPORT.RISK_CONTINUE" />
      </div>
      <div className={styles.addressReturn} onClick={toggleModal}>
        <FormattedMessage id="WALLT.IMPORT.RISK_BACK" />
      </div>
    </Modal>
  );
};

export default memo(WarningModal);
