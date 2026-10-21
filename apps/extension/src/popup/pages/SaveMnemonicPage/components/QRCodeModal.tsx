import { FC, memo } from 'react';
import { useIntl } from 'react-intl';
import { Modal } from 'antd';
import QRCode from 'qrcode.react';

import { WALLET_EXPORT_TYPE } from '../../../../constants/wallet_type';

import Button from '../../../../components/Button';
import styles from '../SaveMnemonicPage.m.scss';

interface Props {
  showQR: boolean;
  account: any;
  exportType: string;
  onToggle: (event: React.MouseEvent) => void;
}

const QRCodeModal: FC<Props> = ({ showQR, account, exportType, onToggle }) => {
  const { formatMessage } = useIntl();
  let content = '';
  let title = '';
  if (exportType === WALLET_EXPORT_TYPE.MNEMONIC) {
    //TODO
    content = account.mnemonic;
    title = formatMessage({
      id: 'CREATION.EXPORT.MNEMONIC.QR_CODE',
    });
  } else if (exportType === WALLET_EXPORT_TYPE.PRIVATE_KEY) {
    content = account.privateKey;
    title = formatMessage({
      id: 'CREATION.EXPORT.PRIVATE_KEY.QR_CODE',
    });
  } else if (exportType === WALLET_EXPORT_TYPE.KEYSTORE) {
    content = account.keystoreStr;
    title = formatMessage({
      id: 'CREATION.EXPORT.KEYSTORE.QR_CODE',
    });
  }

  return (
    <Modal
      closable={false}
      visible={showQR}
      maskClosable={false}
      onCancel={onToggle}
      title={title}
      footer={null}
      centered
      mask={true}
      getContainer={false}
      width={300}
      wrapClassName={styles.qrModal}
    >
      <QRCode value={content} renderAs="svg" size={200} />
      <div className={styles.footer}>
        <Button id="BUTTON.CLOSE" onClick={onToggle} tabIndex={1}>
          &nbsp;
        </Button>
      </div>
    </Modal>
  );
};

export default memo(QRCodeModal);
