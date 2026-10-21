import classNames from 'classnames';
import { useIntl } from 'react-intl';

import NavBar from '../../../../components/NavBar/NavBar';
import AddressBookInput from './components/AddressBookInput';
import AddressBookModal from './components/AddAddressModal';
import AddressBookResult from './components/AddressBookResult';

import useAddressBookBiz from './hook';

import styles from './AddressBookPage.m.scss';
import NoResult from './images/icon-no-result.svg';

const AddressBookPage = () => {
  const { formatMessage } = useIntl();
  const {
    state,
    setSearchKeyWord,
    toggleAddressBookModal,
    gotoAddressBookDetail,
    handleAddAddressBookItem,
  } = useAddressBookBiz();
  const { searchKeyWord, showAddressBookModal, filterAddressBook } = state;

  return (
    <div className={styles.addressBook}>
      {showAddressBookModal && (
        <AddressBookModal
          handleAddAddressBookItem={handleAddAddressBookItem}
          toggleAddressBookModal={toggleAddressBookModal}
        />
      )}

      <NavBar
        title="SETTING.TITLE.ADDRESS_BOOK"
        rightElement={
          <div className={styles.addItem} onClick={toggleAddressBookModal}>
            {formatMessage({ id: 'BUTTON.ADD' })}
          </div>
        }
      />

      <div className={styles.content}>
        <AddressBookInput searchKeyWord={searchKeyWord} setSearchKeyWord={setSearchKeyWord} />

        <div className={classNames(styles.book, styles.scroll)}>
          {filterAddressBook.length > 0 ? (
            <AddressBookResult
              searchKeyWord={searchKeyWord}
              filterAddressBook={filterAddressBook}
              gotoAddressBookDetail={gotoAddressBookDetail}
            />
          ) : (
            <div className={styles.blankSearch}>
              <img src={NoResult} alt="" />
              <span>{formatMessage({ id: 'SETTING.TITLE.ADDRESS_BOOK.SEARCH_BLANK' })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressBookPage;
