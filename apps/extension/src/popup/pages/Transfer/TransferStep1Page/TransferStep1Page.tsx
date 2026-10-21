import { FormattedMessage } from 'react-intl';

import NavBar from '../../../../components/NavBar/NavBar';
import Button from '../../../../components/Button';
import ReceiverInput from './components/ReceiverInput';
import AddressCollection from './components/AddressCollection';

import { useTransferStep1Biz } from './hook';

import styles from './TransferStep1Page.m.scss';

const TransferStep1Page = () => {
  const {
    state,
    setShowAddress,
    showAddressBookDetail,
    addressBookConfirmed,
    addressBookCancel,
    checkShowAddAddressBook,
    changeActiveTab,
    onConfirm,
  } = useTransferStep1Biz();

  const { showAddress, inputStatus } = state;

  return (
    <div className={styles.transferStep1} id="transferStep1">
      <NavBar
        title={
          <div className={styles.title}>
            <FormattedMessage id="ACCOUNT.TYPE.SEND" />
            <span>(1/2)</span>
          </div>
        }
      />
      <div className={styles.content}>
        <ReceiverInput
          state={state}
          setShowAddress={setShowAddress}
          showAddressBookDetail={showAddressBookDetail}
          addressBookConfirmed={addressBookConfirmed}
          addressBookCancel={addressBookCancel}
          checkShowAddAddressBook={checkShowAddAddressBook}
        />

        {showAddress.length === 0 && (
          <AddressCollection
            myAccounts={state.myAccounts}
            addressBooks={state.addressBooks}
            recentRecord={state.recentRecord}
            activeTab={state.activeTab}
            setShowAddress={setShowAddress}
            changeActiveTab={changeActiveTab}
          />
        )}

        <Button
          id="BUTTON.NEXT_STEP"
          isValid={inputStatus !== 'error' && showAddress !== ''}
          onClick={() => {
            onConfirm();
          }}
        />
      </div>
    </div>
  );
};

export default TransferStep1Page;
