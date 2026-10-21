import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Input } from 'antd';
import classNames from 'classnames';

import { State } from '../hook';
import AddressAutoComplete from './AddressAutoComplete';
import AddAddressBook from './AddAddressBook';

import styles from '../TransferStep1Page.m.scss';

interface Props {
  state: State;

  setShowAddress: (value: string) => void;
  showAddressBookDetail: (isShow: boolean) => void;
  addressBookConfirmed: (name: string, address: string, remarks: string) => void;
  addressBookCancel: () => void;
  checkShowAddAddressBook: () => boolean;
}

const ReceiverInput: FC<Props> = ({
  state,

  setShowAddress,
  showAddressBookDetail,
  addressBookConfirmed,
  addressBookCancel,
  checkShowAddAddressBook,
}) => {
  const { formatMessage } = useIntl();
  const {
    showAddress,
    inputStatus,
    inputTips,
    searchResult,
    createAccountCost,
    inputDisable,
    showAddressBook,
  } = state;

  const showAddAddressBook = checkShowAddAddressBook();

  return (
    <div
      className={classNames(
        styles.receiverInput,
        inputStatus === 'error'
          ? styles.error
          : inputStatus === 'warn'
          ? styles.warn
          : inputStatus === 'info'
          ? styles.info
          : '',
      )}
    >
      <p className={styles.title}>
        <FormattedMessage id="ACCOUNT.SEND.RECEIVE_ADDRESS" />
      </p>
      <div className={styles.inputBox}>
        <Input
          disabled={inputDisable}
          value={showAddress}
          placeholder={formatMessage({ id: 'ACCOUNT.SEND.RECEIVE_ADDRESS_PLACEHOLDER' })}
          onChange={(e) => {
            setShowAddress(e.target.value);
          }}
        />
        {showAddress.length === 0 ? (
          ''
        ) : (
          <div
            className={styles.clearBtn}
            onClick={() => {
              setShowAddress('');
            }}
          >
            <i></i>
          </div>
        )}
      </div>

      {inputStatus !== '' && (
        <div className={styles.inputCriteria}>
          <i></i>
          <FormattedMessage id={inputTips} values={{ amount: createAccountCost }} />
        </div>
      )}

      {showAddAddressBook && (
        <div className={styles.addressBook}>
          <span
            className={classNames(styles.addBookSpan, 'cursorPointer')}
            onClick={() => {
              showAddressBookDetail(true);
            }}
          >
            <i></i>
            <FormattedMessage id="ACCOUNT.SEND.ADDRESS_BOOK" />
          </span>
        </div>
      )}

      {showAddress.length > 0 && (
        <AddressAutoComplete
          searchKey={showAddress}
          searchResult={searchResult}
          setShowAddress={setShowAddress}
        />
      )}

      <AddAddressBook
        showAddAddressBook={showAddressBook}
        address={showAddress}
        onConfirm={addressBookConfirmed}
        onCancel={addressBookCancel}
      />
    </div>
  );
};

export default memo(ReceiverInput);
