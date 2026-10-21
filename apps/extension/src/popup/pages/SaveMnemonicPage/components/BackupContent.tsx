import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import _ from 'lodash';

import Toast from '../../../../components/Toast';
import { WALLET_EXPORT_TYPE } from '../constants';

import styles from '../SaveMnemonicPage.m.scss';

interface Account {
  mnemonic: string;
  privateKey: string;
  keystoreStr: string;
}

interface Props {
  exportType: string;
  account: Account;
  toggleQRCode: (event: React.MouseEvent) => void;
}

const BackupContent: FC<Props> = ({ exportType, account, toggleQRCode }) => {
  const { formatMessage } = useIntl();
  let mnemonics = null;
  let content = '';
  let tipTitle = 'WALLET.BACKUP.PRE.TIP_4';
  let tipOne = 'WALLET.BACKUP.PRE.TIP_5';
  let tipTwo = 'WALLET.BACKUP.PRE.TIP_6';

  if (exportType === WALLET_EXPORT_TYPE.MNEMONIC) {
    mnemonics = _.split(account.mnemonic, ' ') || [];
    content = account.mnemonic;
  } else if (exportType === WALLET_EXPORT_TYPE.PRIVATE_KEY) {
    content = account.privateKey;
    tipTitle = 'WALLET.BACKUP.PRIVATEKEY.TIP_4';
    tipOne = 'WALLET.BACKUP.PRIVATEKEY.TIP_6';
    tipTwo = 'WALLET.BACKUP.PRIVATEKEY.TIP_5';
  } else if (exportType === WALLET_EXPORT_TYPE.KEYSTORE) {
    content = account.keystoreStr;
    tipTitle = 'WALLET.BACKUP.KEYSTORE.TIP_6';
    tipOne = 'WALLET.BACKUP.KEYSTORE.TIP_4';
    tipTwo = 'WALLET.BACKUP.KEYSTORE.TIP_5';
  }

  return (
    <div>
      {mnemonics && (
        <div className={classNames(styles.mnemonicList, 'scroll')}>
          <div className={styles.mnemonicListWrap}>
            {mnemonics.map((item, index) => {
              return (
                <div key={`${item}-${index}`} className={styles.mnemonicItem}>
                  <i>{index + 1}</i>
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!mnemonics && <div className={styles.textList}>{content}</div>}

      <div className={styles.mnemonicOperate}>
        <div
          className={styles.operateItem}
          onClick={async (e) => {
            Toast.show({
              icon: 'success',
              content: formatMessage({ id: 'TOAST.COPY' }),
            });
            await window.navigator.clipboard.writeText(content);
          }}
        >
          <i />
          <FormattedMessage id="BUTTON.COPY" />
        </div>
        {/* </CopyToClipboard> */}
        <div className={styles.operateItem} onClick={toggleQRCode}>
          <i />
          <FormattedMessage id="BUTTON.QR_CODE" />
        </div>
      </div>
      <div className={classNames(styles.userPrompt, 'scroll')}>
        <h2>
          <i />
          <FormattedMessage id={tipTitle} />
        </h2>
        <p>
          <FormattedMessage id={tipOne} />
        </p>
        <p>
          <FormattedMessage id={tipTwo} />
        </p>
      </div>
    </div>
  );
};

export default memo(BackupContent);
