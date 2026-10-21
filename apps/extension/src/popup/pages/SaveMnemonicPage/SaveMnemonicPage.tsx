import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { WALLET_EXPORT_TYPE } from './constants';
import NavBar from '../../../components/NavBar/NavBar';
import Button from '../../../components/Button';
import ConfirmPassword from './components/ConfirmPassword';
import BackupGuide from './components/Guide';
import QRCodeModal from './components/QRCodeModal';
import Overlay from './components/Overlay';
import BackupContent from './components/BackupContent';

import { STAGES, useSaveMnemonicBiz } from './hook';

import styles from './SaveMnemonicPage.m.scss';

const SaveMnemonicPage = () => {
  const { state, goBack, onConfirmPassword, toggleQRCode, showContent, hideOverlay, goNextPage } =
    useSaveMnemonicBiz();

  const { stage, isOverlayVisible, showQR, account, isPasswordValid, exportType, remind } = state;

  let headerId = 'WALLET.BACKUP.MNEMONIC.TIP_3';
  let bodyTitle = 'WALLET.BACKUP.MNEMONIC.NEWTIP_1';
  if (exportType == WALLET_EXPORT_TYPE.MNEMONIC && !remind) {
    headerId = 'WALLET.BACKUP.MNEMONIC.NEWTIP_3';
  } else if (exportType === WALLET_EXPORT_TYPE.PRIVATE_KEY) {
    headerId = 'WALLET.BACKUP.PRIVATEKEY.NEWTIP_1';
    bodyTitle = 'WALLET.BACKUP.PRIVATEKEY.NEWTIP_2';
  } else if (exportType === WALLET_EXPORT_TYPE.KEYSTORE) {
    headerId = 'WALLET.BACKUP.KEYSTORE.NEWTIP_1';
    bodyTitle = 'WALLET.BACKUP.KEYSTORE.TIP_2';
  }

  if (stage === STAGES.VERIFY_PASSWORD) {
    return (
      <ConfirmPassword
        isPasswordValid={isPasswordValid}
        onConfirm={onConfirmPassword}
        onCancel={goBack}
      />
    );
  }

  return (
    <div className={styles.saveMnemonicContainer}>
      <QRCodeModal
        showQR={showQR}
        account={account}
        exportType={exportType}
        onToggle={toggleQRCode}
      />

      <NavBar title={headerId} />

      <div className={styles.saveMnemonicContent}>
        <p className={styles.pageIntro}>
          <FormattedMessage id={bodyTitle} />
        </p>

        {stage === STAGES.GUIDE && <BackupGuide remind={remind} onConfirm={showContent} />}

        {stage === STAGES.SHOW_CONTENT && (
          <>
            <div className={styles.mnemonicArea}>
              {isOverlayVisible ? (
                <Overlay exportType={exportType} onClose={hideOverlay} />
              ) : (
                <BackupContent
                  exportType={exportType}
                  account={account}
                  toggleQRCode={toggleQRCode}
                />
              )}
            </div>

            <Button
              id={!remind ? 'BUTTON.START_EXPORT_FINISH' : 'BUTTON.BACKUP'}
              isValid={!isOverlayVisible}
              onClick={goNextPage}
              className={classNames(styles.customButton, {
                [styles.invalid]: isOverlayVisible,
              })}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SaveMnemonicPage;
