import { useNavigate } from 'react-router';
import { FormattedMessage } from 'react-intl';

import { useReceiveBiz } from './hook';
import QRCodeContent from './components/QRCodeContent';
import NavBar from '../../../components/NavBar/NavBar';

import styles from './ReceivePage.m.scss';
import IconBack from './images/icon-back-white.svg';

const ReceivePage = () => {
  const { selectedAddressItem } = useReceiveBiz();
  const navigator = useNavigate();
  const { name, address } = selectedAddressItem;

  const goBack = () => {
    navigator(-1);
  };

  return (
    <div className={styles.receive}>
      <div className={styles.content}>
        <NavBar
          title={
            <span className={styles.receiveTitle}>
              <FormattedMessage id="ACCOUNT.TYPE.RECEIVE" />
            </span>
          }
          leftElement={
            <div>
              <img src={IconBack} className={styles.receiveBack} onClick={goBack} alt="" />
            </div>
          }
        />
        <QRCodeContent name={name} address={address} />
        <div className={styles.receiveTipsWrapper}>
          <span className={styles.star}>*</span>
          <span className={styles.receiveTips}>
            <FormattedMessage id="ACCOUNT.RECEIVE.TIPS" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReceivePage;
