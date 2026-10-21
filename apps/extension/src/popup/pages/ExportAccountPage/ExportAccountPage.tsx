import { FormattedMessage } from 'react-intl';

import { useExportAccountBiz } from './hook';

import { WALLET_EXPORT_TYPE } from '../../../constants/wallet_type';
import NavBar from '../../../components/NavBar/NavBar';

import styles from './ExportAccountPage.m.scss';

const ExportAccountPage = () => {
  const { hasMnemonic, gotoPage, goBack } = useExportAccountBiz();

  return (
    <div className={styles.choosingType}>
      <NavBar onClickLeft={goBack} title="CHOOSING_TYPE.EXPORT.TITLE" />

      <div className={styles.greyModal}>
        {hasMnemonic && (
          <div className={styles.option} onClick={() => gotoPage(WALLET_EXPORT_TYPE.MNEMONIC)}>
            <FormattedMessage id="CHOOSING_TYPE.MNEMONIC.TITLE" />
          </div>
        )}

        <div className={styles.option} onClick={() => gotoPage(WALLET_EXPORT_TYPE.PRIVATE_KEY)}>
          <FormattedMessage id="CHOOSING_TYPE.PRIVATE_KEY.TITLE" />
        </div>

        <div className={styles.option} onClick={() => gotoPage(WALLET_EXPORT_TYPE.KEYSTORE)}>
          <FormattedMessage id="CHOOSING_TYPE.KEY_STORE.TITLE" />
        </div>
      </div>
    </div>
  );
};

export default ExportAccountPage;
