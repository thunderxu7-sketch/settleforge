import { FC, memo } from 'react';
import { Modal } from 'antd';
import { FormattedMessage } from 'react-intl';

import WarningImg from '../../../common/images/warning.svg';

import styles from '../NewHDAddressPage.m.scss';

interface Props {
  isVisible: boolean;
  onClose: (event: React.MouseEvent<Element, MouseEvent>) => void;
  gotoManualPath: (event: React.MouseEvent<Element, MouseEvent>) => void;
}

const ConfirmModal: FC<Props> = ({ isVisible, onClose, gotoManualPath }) => {
  return (
    <Modal visible={isVisible} width={300} className={styles.addressModal}>
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
      <div className={styles.continue} onClick={gotoManualPath}>
        <FormattedMessage id="WALLT.IMPORT.RISK_CONTINUE" />
      </div>
      <div className={styles.addressReturn} onClick={onClose}>
        <FormattedMessage id="WALLT.IMPORT.RISK_BACK" />
      </div>
    </Modal>
  );
};

export default memo(ConfirmModal);
