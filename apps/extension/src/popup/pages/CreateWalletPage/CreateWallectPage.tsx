import { Input } from 'antd';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

import Button from '../../../components/Button';
import InputPassword from '../../../components/InputPassword';
import NavBar from '../../../components/NavBar/NavBar';

import { useCreateWalletBiz } from './hook';

import CreateSuccessImage from './images/icon-create-success.png';

import styles from './CreateWalletPage.m.scss';

const CreateWalletPage = () => {
  const {
    name,
    defaultName,
    onChangeName,
    isNameError,
    password,
    confirmPassword,
    isValidPassword,
    isSamePassword,
    isNeedPassword,
    onChangePasswordState,
    createSuccess,
    submitWalletInfo,
    toSave,
  } = useCreateWalletBiz();

  const isButtonValid =
    ((isNeedPassword && isSamePassword && isValidPassword) || !isNeedPassword) && !isNameError;

  return (
    <>
      {!createSuccess && <NavBar title="CREATION.WALLET.TITLE" />}
      <div className={styles.createWalletContainer}>
        {createSuccess ? (
          <div>
            <div className={styles.createSuccess}>
              <img src={CreateSuccessImage} alt="" />
              <div className={styles.title}>
                <FormattedMessage id="WALLET.CREATE.SUCCESS" />
              </div>
              <div className={styles.desc}>
                <FormattedMessage id="WALLET.CREATE.BACKUP.TIPS_1" />
              </div>
            </div>
            <Button id="CREATION.WALLET.BACKUP_NOW" onClick={toSave} className={styles.toSave} />
          </div>
        ) : (
          <div className={styles.createWalletContent}>
            <p className={styles.pageIntro}>
              <FormattedMessage id="WALLET.CREATE.BACKUP.TIPS_2" />
            </p>
            <div className={styles.tableWrap}>
              <div className={styles.nameArea}>
                <div>
                  <FormattedMessage id="WALLT.IMPORT.WALLET_NAME" />
                </div>
                <Input
                  value={name}
                  allowClear
                  placeholder={defaultName}
                  onChange={onChangeName}
                  maxLength={14}
                />

                {isNameError && (
                  <div className={styles.nameError}>
                    <FormattedMessage id="WALLET.NAME.LENGTH_RULE" />
                  </div>
                )}
              </div>
              {isNeedPassword && (
                <InputPassword
                  isSamePassword={isSamePassword}
                  password={password}
                  confirmPassword={confirmPassword}
                  changeState={onChangePasswordState}
                />
              )}

              <Button
                className={classNames(styles.customButton, {
                  [styles.isValid]: isButtonValid,
                })}
                id="CREATION.WALLET.TITLE"
                isValid={isButtonValid}
                onClick={submitWalletInfo}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CreateWalletPage;
