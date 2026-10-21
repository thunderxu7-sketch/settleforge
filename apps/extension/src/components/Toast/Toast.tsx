import { FC, ReactNode, useEffect, useMemo } from 'react';
import classNames from 'classnames';

import styles from './Toast.m.scss';
import SuccessIcon from './images/icon-success.svg';
import FailedIcon from './images/icon-failed.svg';
import LoadingIcon from './images/loading.gif';

export interface ToastProps {
  afterClose?: () => void;
  content?: ReactNode;
  icon?: 'success' | 'fail' | 'loading' | React.ReactNode;
  duration?: number;
  maxWidth?: number;
  visible?: boolean;
  container?: ReactNode;
}

export const InternalToast: FC<ToastProps> = (props) => {
  const { icon, afterClose, visible, content, maxWidth = 232 } = props;

  const toastElement = useMemo(() => {
    if (icon === null || icon === undefined) return null;
    switch (icon) {
      case 'success':
        return <img src={SuccessIcon} alt="" />;
      case 'fail':
        return <img src={FailedIcon} alt="" />;
      case 'loading':
        return <img src={LoadingIcon} alt="" className={styles.loading} />;
      default:
        return icon;
    }
  }, [icon]);

  useEffect(() => {
    if (!visible) {
      afterClose?.();
    }
  }, [afterClose, visible]);

  return (
    <div className={classNames(styles.tronlinkToast)}>
      <div className={styles.tronLinkToastText} style={{ maxWidth: `${maxWidth}px` }}>
        {toastElement && <div className={styles.toastIcon}>{toastElement}</div>}
        {content && <div className={styles.toastContent}>{content}</div>}
      </div>
    </div>
  );
};
