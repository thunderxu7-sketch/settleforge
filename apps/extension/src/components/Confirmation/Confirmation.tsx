import type { ReactNode } from 'react';
import { FC, memo } from 'react';

import Button from '../Button';

import styles from './Confirmation.m.scss';

interface Props {
  show: boolean;
  title: ReactNode;
  body: ReactNode;
  onClose: () => void;
  onConfirmed: () => void;
}

const Confirmation: FC<Props> = ({ show, title, body, onClose, onConfirmed }) => {
  return show ? (
    <div className={styles.confirmWrap}>
      <div className={styles.confirm}>
        <div className={styles.title}>{title}</div>
        <div className={styles.body}>{body}</div>
        <div className={styles.btnGroup}>
          <Button id="BUTTON.CLOSE" onClick={onClose} />
          <Button id="BUTTON.CONFIRM" onClick={onConfirmed} />
        </div>
      </div>
    </div>
  ) : null;
};

export default memo(Confirmation);
