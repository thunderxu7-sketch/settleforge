import { FC, memo } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

import styles from '../ConnectWebsitePage.m.scss';

interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

const Buttons: FC<Props> = ({ onCancel, onConfirm }) => {
  return (
    <div className={classNames(styles.buttonsContainer, 'row', 'spaceBetween')}>
      <button onClick={onCancel} className={classNames(styles.cancelButton, 'cursorPointer')}>
        <FormattedMessage id="BUTTON.REJECT2" />
      </button>

      <button onClick={onConfirm} className={classNames(styles.confirmButton, 'cursorPointer')}>
        <FormattedMessage id="BUTTON.CONNECT" />
      </button>
    </div>
  );
};

export default memo(Buttons);
