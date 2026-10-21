import { FormattedMessage } from 'react-intl';

import Button from '../../../components/Button';

import { useBroadCastBiz } from './hook';

import styles from './BroadcastPage.m.scss';

import BroadcastSuccess from './images/icon-broadcast-success.svg';
import BroadcastFail from './images/icon-broadcast-fail.svg';

const BroadcastPage = () => {
  const { txId, goHomePage, goTransactionDetail, goTransfer } = useBroadCastBiz();

  return (
    <div className={styles.broadcast}>
      <div className={styles.content}>
        {txId ? (
          <div className={styles.success}>
            <div className={styles.stateImg}>
              <img src={BroadcastSuccess} />
            </div>
            <h1>
              <FormattedMessage id="BROADCAST.SUCCESS.TITLE" />
            </h1>
            <p>
              <FormattedMessage id="BROADCAST.SUCCESS.INTRO" />
            </p>
          </div>
        ) : (
          <div className={styles.fail}>
            <div className={styles.stateImg}>
              <img src={BroadcastFail} />
            </div>
            <h1>
              <FormattedMessage id="BROADCAST.FAIL.TITLE" />
            </h1>
            <p>
              <FormattedMessage id="BROADCAST.FAIL.INTRO" />
            </p>
          </div>
        )}
        {txId ? (
          <div className={styles.successBtnGroup}>
            <Button
              id="BUTTON.FINISH"
              onClick={() => {
                goHomePage();
              }}
            />
            <Button
              id="BUTTON.TRANSACTION.DETAIL"
              onClick={() => {
                goTransactionDetail();
              }}
            />
          </div>
        ) : (
          <div className={styles.failBtnGroup}>
            <Button
              id="BUTTON.TRANSACTION.RETRY"
              onClick={() => {
                goTransfer();
              }}
            />
            <Button
              id="BUTTON.HOME"
              onClick={() => {
                goHomePage();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BroadcastPage;
