import { ChangeEvent, FC, memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Input } from 'antd';

import { WALLET_IMPORT_TYPE } from '../../../../constants/wallet_type';
import InputPassword from '../../../../components/InputPassword';

import WarningImg from '../../../common/images/warning.svg';

import styles from './../ImportWalletPage.m.scss';

interface Props {
  step: number;
  importType: string;
  importName: string;
  isNameError: boolean;
  onChangeName: (event: ChangeEvent<HTMLInputElement>) => void;
  password: string;
  isSamePassword: boolean;
  confirmPassword: string;
  isNeedPassword: boolean;
  onChangePassword: (val: string) => void;
  onChangePasswordState: (val: any) => void;
}

const WalletInfo: FC<Props> = ({
  step,
  importType,
  importName,
  isNameError,
  onChangeName,
  password,
  isSamePassword,
  confirmPassword,
  isNeedPassword,
  onChangePassword,
  onChangePasswordState,
}) => {
  const { formatMessage } = useIntl();
  const onInputPassword = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChangePassword(e.target.value);
    },
    [onChangePassword],
  );

  if (step !== 1) {
    return null;
  }

  return (
    <div className={classNames(styles.walletInfo, 'scroll')}>
      <div className={styles.walletName}>
        <FormattedMessage id="WALLT.IMPORT.WALLET_NAME" />
      </div>

      <div className={styles.walletNameInputWrapper}>
        <Input
          value={importName}
          allowClear
          placeholder={formatMessage({ id: 'WALLT.IMPORT.IMPORT_BTN' })}
          onChange={onChangeName}
          maxLength={14}
        />

        {isNameError && (
          <div className={styles.nameError}>
            <FormattedMessage id="WALLET.NAME.LENGTH_RULE" />
          </div>
        )}
      </div>

      {isNeedPassword && importType !== WALLET_IMPORT_TYPE.KEYSTORE && (
        <InputPassword
          isSamePassword={isSamePassword}
          password={password}
          confirmPassword={confirmPassword}
          changeState={onChangePasswordState}
        />
      )}

      {importType === WALLET_IMPORT_TYPE.KEYSTORE && (
        <>
          <p>
            <FormattedMessage id="WALLT.IMPORT.KEYSTORE_PASSWORD" />
          </p>
          <Input
            type="password"
            value={password}
            allowClear
            placeholder={formatMessage({
              id: 'CREATION.RESTORE.KEY_STORE.INPUT_PASSWORD.TIPS',
            })}
            onChange={onInputPassword}
          />

          {isNeedPassword && (
            <p className={classNames(styles.passwordTips, 'flex')}>
              <img src={WarningImg} alt="" />
              <FormattedMessage id="WALLT.IMPORT.REMEMBER" />
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default memo(WalletInfo);
