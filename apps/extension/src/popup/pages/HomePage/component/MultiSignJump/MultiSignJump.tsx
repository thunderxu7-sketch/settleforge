import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './MultiSignJump.m.scss';

interface Props {
  isVisible: boolean;
  jumpUrl: string;
  onClose: () => void;
}

const DURATION = 3;

const MultiSignJump: FC<Props> = ({ isVisible, jumpUrl, onClose }) => {
  const intl = useIntl();
  const [countdown, setCountdown] = useState(DURATION);
  const ref = useRef(DURATION);

  const closeAndJump = useCallback(() => {
    onClose();
    window.open(jumpUrl);
  }, [onClose, jumpUrl]);

  // initialize
  useEffect(() => {
    let timer = 0;
    if (isVisible) {
      ref.current = DURATION;
      setCountdown(ref.current);
      timer = window.setInterval(() => {
        ref.current--;
        setCountdown(ref.current);
        if (ref.current <= 0) {
          closeAndJump();
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

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <div className={styles.label}>
          <div
            dangerouslySetInnerHTML={{
              __html: intl.formatMessage(
                {
                  id: 'ACCOUNT.MULTI_SIGN.JUMP_DESC',
                },
                {
                  strong: (chunks) => `<span class='${styles.boxDesc}'>${chunks}</span>`,
                },
              ),
            }}
            className={styles.deleteTitle}
          />
        </div>

        <button className={styles.confirmButton} onClick={closeAndJump}>
          <FormattedMessage
            id="BUTTON.CONFIRM_SECONDS"
            values={{ amount: (countdown < 0 ? 0 : countdown) || 0 }}
          />
        </button>
      </div>
    </div>
  );
};

export default memo(MultiSignJump);
