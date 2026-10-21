import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { Input } from 'antd';

import { useImportConfirmBiz } from './hook';
import { WALLET_IMPORT_TYPE } from '../../../constants/wallet_type';
import NavBar from '../../../components/NavBar/NavBar';
import AccountRow from '../../../components/AccountRow/AccountRow';
import InputPassword from '../../../components/InputPassword/InputPassword';
import LedgerConfirmModal from './components/LedgerConfirmModal';

import styles from './LedgerConfirmPage.m.scss';

const LedgerConfirmPage = () => {
  const {
    name,
    defaultName,
    isNameError,
    onChangeName,
    password,
    confirmPassword,
    isSamePassword,
    isNeedPassword,
    onChangePasswordState,
    state,
    goChooseAddress,
    onToggleItem,
    onSubmit,
    isAccountExist,
    isAddressSelected,
    hasSelected,
    hasWrongInput,
    isModalVisible,
    backPrePage,
    retryGetLedgerAccount,
    modalType,
  } = useImportConfirmBiz();

  const { accounts } = state;

  return (
    <>
      <NavBar title="GUIDE.IMPORT_WALLET" />
      <div className={styles.content}>
        <div className={classNames(styles.addressWrap, 'scroll')}>
          <p className={classNames(styles.titleTips, 'flex', 'scroll')}>
            <span>
              <FormattedMessage id="WALLT.IMPORT.ACCOUNT_TIP" />
            </span>
            <em onClick={goChooseAddress}>
              <FormattedMessage id="WALLT.IMPORT.CHOOSE_ADDRESS" />
            </em>
          </p>

          {accounts &&
            accounts.map(({ address, index, path, balance }) => {
              return (
                <AccountRow
                  key={address}
                  importType={WALLET_IMPORT_TYPE.LEDGER}
                  address={address}
                  path={path ? path : `m/44'/195'/${index}'/0/0`}
                  rowIndex={index}
                  balance={balance || '0'}
                  isActive={isAddressSelected(address)}
                  isImported={isAccountExist(address)}
                  onToggleItem={onToggleItem}
                />
              );
            })}
        </div>
        <div className={classNames(styles.walletInfo, 'scroll')}>
          <div className={styles.nameArea}>
            <p>
              <FormattedMessage id="WALLT.IMPORT.WALLET_NAME" />
            </p>
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
        </div>
      </div>

      <div
        className={classNames(styles.button, {
          [styles.disabled]: !hasSelected || hasWrongInput,
        })}
        onClick={onSubmit}
      >
        <FormattedMessage id="WALLT.IMPORT.IMPORT_CONFIRM_BTN" />
      </div>

      <LedgerConfirmModal
        visible={isModalVisible}
        onCancel={backPrePage}
        onSubmit={retryGetLedgerAccount}
        type={modalType}
      />
    </>
  );
};
export default LedgerConfirmPage;
