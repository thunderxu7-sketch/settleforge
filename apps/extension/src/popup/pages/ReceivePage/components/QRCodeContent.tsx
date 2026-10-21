import { FC, memo } from 'react';
import { useIntl } from 'react-intl';
import QRCode from 'qrcode.react';
import { Tooltip } from 'antd';

import Toast from '../../../../components/Toast';

import styles from '../ReceivePage.m.scss';

import Copy from '../images/copy.svg';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

interface Props {
  name: string;
  address: string;
}

const QRCodeContent: FC<Props> = ({ name, address }) => {
  const { formatMessage } = useIntl();
  return (
    <div className={styles.qRCode}>
      <p className={styles.title}>{formatMessage({ id: 'ACCOUNT.RECEIVE.SCAN' })}</p>
      <div className={styles.qRCodePic}>
        <QRCode value={address} size={200} />
      </div>
      <p className={styles.name}>{name}</p>
      <div className={styles.address}>
        <span>{address}</span>

        <Tooltip
          overlayInnerStyle={toolTipsOverlayInnerStyle}
          title={formatMessage({
            id: 'TOOLTIP.COPY',
          })}
        >
          <img
            src={Copy}
            alt=""
            onClick={async (e) => {
              Toast.show({
                icon: 'success',
                content: formatMessage({ id: 'TOAST.COPY' }),
              });
              await window.navigator.clipboard.writeText(address);
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default memo(QRCodeContent);
