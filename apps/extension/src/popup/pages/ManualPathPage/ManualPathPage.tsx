import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import _ from 'lodash';

import NavBar from '../../../components/NavBar/NavBar';
import WalletName from './components/WalletName';
import Tips from './components/Tips';
import PathInput from './components/PathInput';
import AccountRow from '../../../components/AccountRow/AccountRow';
import { WALLET_IMPORT_TYPE } from '../../../constants/wallet_type';

import { useManualPathBiz } from './hook';

import styles from './ManualPathPage.m.scss';

const ManualPathPage = () => {
  const { state, changeIndex, onConfirm, updateWalletName, isImported, isDisabled } =
    useManualPathBiz();

  const { account, accountIndex, addressIndex, name, isNameError } = state;

  return (
    <>
      <NavBar title="WALLT.IMPORT.DEFINE_PATH" />

      <div className={styles.content}>
        <WalletName name={name} updateWalletName={updateWalletName} isNameError={isNameError} />

        <Tips />

        <PathInput accountIndex={accountIndex} addressIndex={addressIndex} onChange={changeIndex} />

        {account && (
          <AccountRow
            importType={WALLET_IMPORT_TYPE.MNEMONIC}
            path={
              _.size(account.path) > 0
                ? account.path
                : `m/44'/195'/${accountIndex}'/0/${addressIndex}`
            }
            address={account.address}
            balance={account.balance || '0'}
            isActive={true}
            isImported={isImported}
          />
        )}

        <div
          className={classNames(styles.button, {
            [styles.disabled]: isDisabled,
          })}
          onClick={onConfirm}
        >
          <FormattedMessage id="HD.NEW_ADDRESS_BTN" />
        </div>
      </div>
    </>
  );
};

export default ManualPathPage;
