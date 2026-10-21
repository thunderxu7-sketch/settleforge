import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import Button from '../../../../components/Button';

import styles from '../SaveMnemonicPage.m.scss';

import StartSave from '../images/icon-start-save.gif';

interface Props {
  remind: boolean;
  onConfirm: (event: React.MouseEvent) => void;
}

const BackupGuide: FC<Props> = ({ remind, onConfirm }) => {
  return (
    <>
      <div className={styles.imgContainer}>
        <img className={styles.startSaveCover} src={StartSave} alt="" />
        {remind && (
          <p className={styles.tips}>
            <FormattedMessage id="WALLET.BACKUP.MNEMONIC.NEWTIP_2" />
          </p>
        )}
      </div>

      <Button
        id={!remind ? 'BUTTON.START_EXPORT' : 'BUTTON.START_BACKUP'}
        onClick={onConfirm}
        className={styles.customButton}
      />
    </>
  );
};

export default memo(BackupGuide);
