import type { FC, MouseEvent } from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Modal } from 'antd';
import { FormattedMessage } from 'react-intl';

import WarningImg from '../../../../static/images/warning.svg';

import styles from '../LoginPage.m.scss';

interface Props {
  isVisible: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const COUNT_DOWN_SECONDS = 10;

const WarningModal: FC<Props> = ({ isVisible, onConfirm, onClose }) => {
  const [countdown, setCountdown] = useState<number>(COUNT_DOWN_SECONDS);
  const ref = useRef<number>(COUNT_DOWN_SECONDS);

  // initialize
  useEffect(() => {
    let timer = 0;
    if (isVisible) {
      ref.current = COUNT_DOWN_SECONDS;
      setCountdown(ref.current);
      // @ts-ignore
      timer = setInterval(() => {
        ref.current--;
        setCountdown(ref.current);
        if (ref.current <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    } else {
      if (timer) {
        clearInterval(timer);
      }
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isVisible]);

  const confirmHandler = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (ref.current <= 0) {
        onConfirm();
      }
    },
    [onConfirm],
  );

  return (
    <Modal visible={isVisible} width={300} centered className={styles.addressModal}>
      <div className={styles.addressHeader}>
        <div>
          <FormattedMessage id="WALLET.ACCOUNT.SAFETY_TIP" />
        </div>
      </div>

      <p className={styles.resetDesc}>
        <img src={WarningImg} alt="" />
        <FormattedMessage id="WALLET.LOGIN.TIP_1" />
      </p>

      <p className={styles.resetDesc}>
        <img src={WarningImg} alt="" />
        <FormattedMessage id="WALLET.LOGIN.TIP_2" />
      </p>

      <p className={classNames(styles.resetDesc, styles.red)}>
        <img src={WarningImg} alt="" />
        <FormattedMessage id="WALLET.LOGIN.TIP_3" />
      </p>

      <div
        className={classNames(styles.commonBtn, styles.walletBtn, {
          [styles.disabled]: countdown !== 0,
        })}
        onClick={confirmHandler}
      >
        {countdown === 0 && <FormattedMessage id="BUTTON.CONTINUE" />}
        {countdown > 0 && (
          <FormattedMessage id="WALLET.LOGIN.BUTTON.CONTINUE" values={{ second: countdown }} />
        )}
      </div>

      <div className={styles.addressReturn} onClick={onClose}>
        <FormattedMessage id="WALLT.IMPORT.RISK_BACK" />
      </div>
    </Modal>
  );
};

export default memo(WarningModal);
