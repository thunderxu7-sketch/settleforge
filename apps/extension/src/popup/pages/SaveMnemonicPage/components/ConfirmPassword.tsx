import { FC, memo, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Input } from 'antd';

import Button from '../../../../components/Button';
import styles from '../SaveMnemonicPage.m.scss';

interface Props {
  isPasswordValid: boolean;
  onConfirm: (value: string) => void;
  onCancel: (event: React.MouseEvent) => void;
}

const ConfirmPassword: FC<Props> = ({ isPasswordValid, onConfirm, onCancel }) => {
  const [password, setPassword] = useState('');
  const [clearMsg, setClearMsg] = useState(false);

  const confirmWrapper = useCallback(async () => {
    await onConfirm(password);
    setClearMsg(false);
  }, [password, onConfirm]);

  useEffect(() => {
    setClearMsg(true);
  }, [password]);

  const { formatMessage } = useIntl();

  const errorVisible = password && !clearMsg && !isPasswordValid;
  return (
    <div className={styles.authPasswordWrap}>
      <div className={styles.confirmPassword}>
        <div className={styles.title}>
          <FormattedMessage id="MENU.ENTER_PASSWORD" />
        </div>
        <div className={styles.option}>
          <Input
            value={password}
            allowClear
            type="password"
            placeholder={formatMessage({ id: 'INPUT.PASSWORD' })}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={confirmWrapper}
          />
          {errorVisible && (
            <div className={styles.errTip}>
              {formatMessage({ id: 'ERRORS.INVALID_PASSWORD_RETRY' })}
            </div>
          )}
        </div>
        <div className={styles.buttonRow}>
          <Button
            id="BUTTON.CANCEL"
            type="secondary"
            onClick={onCancel}
            tabIndex={1}
            className={classNames(styles.customButton, styles.gray)}
          />
          <Button
            id="BUTTON.CONFIRM"
            isValid={!!password}
            onClick={confirmWrapper}
            tabIndex={1}
            className={styles.customButton}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ConfirmPassword);
