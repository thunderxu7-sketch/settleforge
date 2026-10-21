import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import classNames from 'classnames';

import { useImportConfirmBiz } from './hook';

import NavBar from '../../../components/NavBar/NavBar';
import AccountRow from '../../../components/AccountRow/AccountRow';
import { WALLET_IMPORT_TYPE } from '../../../constants/wallet_type';

import styles from './ImportConfirmPage.m.scss';

const ImportConfirmPage = () => {
  const {
    state,
    goChooseAddress,
    onToggleItem,
    onSubmit,
    isAccountExist,
    isAddressSelected,
    hasSelected,
  } = useImportConfirmBiz();

  const { data = {}, accounts, oldAccounts } = state;
  const { type: importType } = data;

  return (
    <>
      <NavBar title="GUIDE.IMPORT_WALLET" />

      <div className={styles.content}>
        <div className={classNames(styles.addressWrap, 'scroll')}>
          <p className={classNames(styles.titleTips, 'flex', 'scroll')}>
            <span>
              <FormattedMessage id="WALLT.IMPORT.ACCOUNT_TIP" />
            </span>
            {importType === WALLET_IMPORT_TYPE.MNEMONIC && (
              <em onClick={goChooseAddress}>
                <FormattedMessage id="WALLT.IMPORT.CHOOSE_ADDRESS" />
              </em>
            )}
          </p>

          {importType === WALLET_IMPORT_TYPE.PRIVATE_KEY && _.size(oldAccounts) > 0 && (
            <p className={styles.titleTips}>
              <span className={styles.text}>
                <FormattedMessage id="WALLT.IMPORT.KEY_TIP_1" />
              </span>
            </p>
          )}

          {accounts.map(({ address, index, path, balance }) => {
            return (
              <AccountRow
                key={address}
                importType={importType}
                address={address}
                path={_.size(path) > 0 ? path : `m/44'/195'/0'/0/${index}`}
                rowIndex={index}
                balance={balance || '0'}
                isActive={isAddressSelected(address)}
                isImported={isAccountExist(address)}
                onToggleItem={onToggleItem}
              />
            );
          })}

          {_.size(oldAccounts) > 0 && (
            <div className={styles.oldAccounts}>
              <p className={styles.titleTips}>
                <span className={styles.text}>
                  <FormattedMessage
                    id={
                      importType === WALLET_IMPORT_TYPE.MNEMONIC
                        ? 'WALLT.IMPORT.MNEMONIC_TIP_1'
                        : 'WALLT.IMPORT.KEY_TIP_2'
                    }
                  />
                </span>
              </p>
              <div className={styles.addressInfos}>
                {oldAccounts.map(({ address, index, balance }) => {
                  return (
                    <AccountRow
                      key={address}
                      importType={importType}
                      address={address}
                      path={`m/44'/195'/${index}'/0/0`}
                      rowIndex={index}
                      balance={balance || '0'}
                      isActive={isAddressSelected(address)}
                      isImported={isAccountExist(address)}
                      onToggleItem={onToggleItem}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className={classNames(styles.button, {
          [styles.disabled]: !hasSelected,
        })}
        onClick={onSubmit}
      >
        <FormattedMessage id="WALLT.IMPORT.IMPORT_CONFIRM_BTN" />
      </div>
    </>
  );
};
export default ImportConfirmPage;
