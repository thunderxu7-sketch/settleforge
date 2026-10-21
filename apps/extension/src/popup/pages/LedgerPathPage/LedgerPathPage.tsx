import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import _ from 'lodash';

import NavBar from '../../../components/NavBar/NavBar';
import PathInput from './components/PathInput';
import Tips from './components/Tips';
import AccountRow from '../../../components/AccountRow/AccountRow';
import { useImportPathBiz } from './hook';
import { WALLET_IMPORT_TYPE } from '../../../constants/wallet_type';

import styles from './LedgerPathPage.m.scss';

const LedgerPathPage = () => {
  const { state, changeIndex, onConfirm, isImported, isDisabled } = useImportPathBiz();

  const { accountIndex, addressIndex, account } = state;

  return (
    <>
      <NavBar title="WALLT.IMPORT.DEFINE_PATH" />

      <div className={styles.content}>
        <Tips />

        <PathInput accountIndex={accountIndex} addressIndex={addressIndex} onChange={changeIndex} />

        {/* {account && <AccountRow account={account} isImported={isImported} />} */}
        {account && (
          <AccountRow
            importType={WALLET_IMPORT_TYPE.LEDGER}
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
          <FormattedMessage id="WALLT.IMPORT.CONFIRM_BTN" />
        </div>
      </div>
    </>
  );
};

export default LedgerPathPage;
