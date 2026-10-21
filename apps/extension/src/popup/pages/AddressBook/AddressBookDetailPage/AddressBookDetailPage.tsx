import { useIntl } from 'react-intl';

import NavBar from '../../../../components/NavBar/NavBar';
import AddressBookForm from '../components/AddressBookForm';
import DeleteAddressBookItemPopup from './components/DeleteAddressBookItemPopup';

import useAddressBookDetailBiz from './hook';

import styles from './AddressBookDetailPage.m.scss';

const AddressBookDetailPage = () => {
  const { formatMessage } = useIntl();
  const {
    state,
    handleUpdateAddressBookItem,
    handleDeleteAddressBookItem,
    toggleDeleteAddressBookItemPopup,
  } = useAddressBookDetailBiz();

  return (
    <div className={styles.addressBookDetail}>
      {state.showDeletePopup && (
        <DeleteAddressBookItemPopup
          handleDeleteAddressBookItem={handleDeleteAddressBookItem}
          toggleDeleteAddressBookItemPopup={toggleDeleteAddressBookItemPopup}
        />
      )}
      <NavBar
        title="SETTING.TITLE.ADDRESS_BOOK.DETAIL"
        rightElement={
          <div className={styles.deleteAddress} onClick={toggleDeleteAddressBookItemPopup}>
            {formatMessage({ id: 'BUTTON.DELETE' })}
          </div>
        }
      />
      <div className={styles.addressBookContent}>
        <AddressBookForm onSubmit={handleUpdateAddressBookItem} />
      </div>
    </div>
  );
};

export default AddressBookDetailPage;
