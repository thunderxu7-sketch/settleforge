import { useCallback } from 'react';
import { memo, FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { Modal, Button } from 'antd';

import { OFFICIAL_WEBSITE } from '../../../../../../constants/common';

import styles from './DAppChainModal.m.scss';

import logo from './images/logo.svg';

interface Props {
  isVisible: boolean;
  setShowDAppChainModal: (isShow: boolean) => void;
}

const getContainerFunc: () => HTMLElement = () => {
  return document.querySelector('#dAppChainModal') ?? document.body;
};

const DAppChainModal: FC<Props> = ({ isVisible, setShowDAppChainModal }) => {
  const onConfirm = useCallback(() => {
    setShowDAppChainModal(false);
  }, []);

  return (
    <div className={styles.dAppChainModal} id="dAppChainModal">
      <Modal
        visible={isVisible}
        onOk={onConfirm}
        closable={false}
        getContainer={getContainerFunc}
        footer={[
          <Button onClick={onConfirm} key="confirm_button">
            <FormattedMessage id="BUTTON.CONFIRM" />
          </Button>,
        ]}
      >
        <h3 className={styles.overview}>
          <FormattedMessage id="ASSET.TOKEN.TRANSFER.TITLE" />
        </h3>

        <div className={styles.detail}>
          <div>
            <FormattedMessage id="ASSET.TOKEN.TRANSFER.CONTENT" />
          </div>
        </div>

        <div className={styles.logo}>
          <img src={logo} />
          <a href={OFFICIAL_WEBSITE} target="official_website">
            <FormattedMessage id="ASSET.TOKEN.TRANSFER.LINK" />
          </a>
        </div>
      </Modal>
    </div>
  );
};

export default memo(DAppChainModal);
