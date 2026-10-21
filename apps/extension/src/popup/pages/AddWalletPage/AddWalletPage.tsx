import { useIntl } from 'react-intl';

import { Row, useAddWalletBiz } from './hook';

import CreateWalletIcon from './images/icon-create-wallet.svg';
import ImportWalletIcon from './images/icon-import-wallet.svg';
import LedgerIcon from './images/icon-ledger.svg';
import NewAddressIcon from './images/icon-new-address.svg';
import NavBar from '../../../components/NavBar/NavBar';

import styles from './AddWalletPage.m.scss';

const defaultRows: Row[] = [
  {
    title: 'HD.REQUEST_NEW_ADDRESS',
    desc: 'HD.REQUEST_NEW_ADDRESS.TIPS',
    icon: <img src={NewAddressIcon} alt="" />,
    actionType: 'NEW_ADDRESS',
  },
  {
    title: 'CREATION.WALLET.TITLE',
    desc: 'CREATION.WALLET.TITLE.TIPS',
    icon: <img src={CreateWalletIcon} alt="" />,
    actionType: 'CREATE_WALLET',
  },
  {
    title: 'GUIDE.IMPORT_WALLET',
    desc: 'GUIDE.IMPORT_WALLET.TIPS',
    icon: <img src={ImportWalletIcon} alt="" />,
    actionType: 'IMPORT_WALLET',
  },
  {
    title: 'WALLET.ADD.LEDGER',
    desc: 'WALLET.ADD.LEDGER.TIPS',
    icon: <img src={LedgerIcon} alt="" />,
    actionType: 'LEDGER',
  },
];

const AddWalletPage = () => {
  const intl = useIntl();

  const { rows, gotoPage, goBack } = useAddWalletBiz(defaultRows);
  return (
    <div className={styles.addWalletContainer}>
      <NavBar onClickLeft={goBack} title="HOME.MENU.ADD_WALLET" />
      <div className={styles.addWalletContent}>
        <ul className={styles.methodList}>
          {rows.map((row, index) => {
            return (
              <li onClick={() => gotoPage(row)} key={index} className={styles.methodItem}>
                <div className={styles.icon}>{row.icon}</div>
                <div className={styles.content}>
                  <p className={styles.title}>{intl.formatMessage({ id: row.title })}</p>
                  <p className={styles.desc}>{intl.formatMessage({ id: row.desc })}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AddWalletPage;
