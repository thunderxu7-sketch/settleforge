import { memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Modal, Button } from 'antd';

import { useVersionUpdateModal } from './hook';
import packageInfo from '../../../package.json';

import styles from './VersionUpdateModal.m.scss';

import newVersion from './images/newVersion.svg';

const getContainerFunc: () => HTMLElement = () => {
  return document.querySelector('#versionUpdateModal') ?? document.body;
};

const VersionUpdateModal = () => {
  const { state, onConfirm } = useVersionUpdateModal();

  return (
    <div className={styles.versionUpdateModal} id="versionUpdateModal">
      <Modal
        visible={state.isVisible}
        onOk={onConfirm}
        closable={false}
        getContainer={getContainerFunc}
        footer={[
          <Button onClick={onConfirm} key="confirm_button">
            <FormattedMessage id="BUTTON.GOT_IT" />
          </Button>,
        ]}
      >
        <div className={styles.topImg}>
          <img src={newVersion} />
        </div>
        <h3 className={styles.overview}>
          <FormattedMessage
            id="HOME.FIND.VERSION.TITLE"
            values={{
              span: (value: any) => <span>{value}</span>,
              version: `V${packageInfo.version}`,
            }}
          />
        </h3>

        <div className={styles.detail}>
          <div>
            <FormattedMessage id="HOME.FIND.VERSION.CONTENT" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default memo(VersionUpdateModal);
