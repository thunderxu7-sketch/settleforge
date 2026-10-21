import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import SaveVideo from '../images/icon-save-video.svg';
import { WALLET_EXPORT_TYPE } from '../constants';

import styles from '../SaveMnemonicPage.m.scss';

interface Props {
  exportType: string;
  onClose: (event: React.MouseEvent) => void;
}

const Overlay: FC<Props> = ({ exportType, onClose }) => {
  let preTitle = 'WALLET.BACKUP.PRE.TIP';
  let btnTitle = 'BUTTON.VIEW_MNEMONIC';

  if (exportType === WALLET_EXPORT_TYPE.MNEMONIC) {
    // ignore
  } else if (exportType === WALLET_EXPORT_TYPE.PRIVATE_KEY) {
    preTitle = 'WALLET.BACKUP.PRIVATEKEY.TIP_3';
    btnTitle = 'BUTTON.VIEW_PRIVATEKEY';
  } else if (exportType === WALLET_EXPORT_TYPE.KEYSTORE) {
    preTitle = 'WALLET.BACKUP.KEYSTORE.TIP_3';
    btnTitle = 'BUTTON.VIEW_KEYSTORE';
  }

  return (
    <>
      <div
        className={classNames(styles.opacityBg, {
          [styles.mnemonic]: exportType === WALLET_EXPORT_TYPE.MNEMONIC,
          [styles.privateKey]: exportType === WALLET_EXPORT_TYPE.PRIVATE_KEY,
          [styles.keystore]: exportType === WALLET_EXPORT_TYPE.KEYSTORE,
        })}
      >
        <img src={SaveVideo} alt="" />
        <p>
          <FormattedMessage id={preTitle} />
        </p>
        <p>
          <FormattedMessage id="WALLET.BACKUP.PRE.TIP_2" />
        </p>
        <button onClick={onClose}>
          <FormattedMessage id={btnTitle} />
        </button>
      </div>
      <div className={styles.warningTips}>
        <i />
        <FormattedMessage id="WALLET.BACKUP.PRE.TIP_3" />
      </div>
    </>
  );
};

export default memo(Overlay);
