import { FC, memo } from 'react';

import { FormattedMessage } from 'react-intl';
import styles from './Modal.m.scss';

interface Props {
  show: boolean;
  title: string;
  content: string;
  onCancel: (event: React.MouseEvent<Element, MouseEvent>) => void;
  onConfirm: (event: React.MouseEvent<Element, MouseEvent>) => void;
  btnCancel: string;
  btnConfirm: string;
}

const Modal: FC<Props> = ({
  show,
  title,
  content,
  onCancel,
  onConfirm,
  btnCancel = 'BUTTON.CANCEL',
  btnConfirm = 'BUTTON.CONFIRM',
}) => {
  return show ? (
    <div className={styles.modalWrap}>
      <div className={styles.modal}>
        <div className={styles.title}>
          <FormattedMessage id={title} />
        </div>
        {content && (
          <div className={styles.desc}>
            <FormattedMessage id={content} />
          </div>
        )}
        <div className={styles.btnGroup}>
          <button className={styles.cancel} onClick={onCancel}>
            <FormattedMessage id={btnCancel} />
          </button>
          <button className={styles.confirm} onClick={onConfirm}>
            <FormattedMessage id={btnConfirm} />
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default memo(Modal);
