import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import NavBar from '../../../components/NavBar/NavBar';
import AccountRow from '../../../components/AccountRow/AccountRow';
import WarningModal from './components/WarningModal';
import { WALLET_IMPORT_TYPE } from '../../../constants/wallet_type';

import { useImportAddressBiz } from './hook';

import styles from './LedgerAddressPage.m.scss';

const LedgerAddressPage = () => {
  const {
    state,
    onEndReached,
    onToggleItem,
    toggleModal,
    onConfirm,
    onConfirmModal,
    isAccountExist,
    isAddressSelected,
    hasSelected,
  } = useImportAddressBiz();

  const { showModal, accountList } = state;

  return (
    <>
      <NavBar title="WALLT.IMPORT.CHOOSE_ADDRESS" />
      <div className={styles.commonContent}>
        <p className={classNames(styles.titleTips, 'flex')}>
          <span />
          <em onClick={toggleModal}>
            <FormattedMessage id="WALLT.IMPORT.DEFINE_PATH" />
          </em>
        </p>

        <div className={classNames(styles.addressWrap, 'scroll')} onScroll={onEndReached}>
          {accountList.map(({ address, index, balance }) => {
            return (
              <AccountRow
                key={address}
                importType={WALLET_IMPORT_TYPE.LEDGER}
                address={address}
                rowIndex={index}
                path={`m/44'/195'/${index}'/0/0`}
                balance={balance || '0'}
                isActive={isAddressSelected(address)}
                isImported={isAccountExist(address)}
                onToggleItem={onToggleItem}
              />
            );
          })}
        </div>

        <div
          className={classNames(styles.button, {
            [styles.disabled]: !hasSelected,
          })}
          onClick={onConfirm}
        >
          <FormattedMessage id="WALLT.IMPORT.CONFIRM_BTN" />
        </div>
      </div>
      <WarningModal showModal={showModal} toggleModal={toggleModal} onConfirm={onConfirmModal} />
    </>
  );
};

export default LedgerAddressPage;
