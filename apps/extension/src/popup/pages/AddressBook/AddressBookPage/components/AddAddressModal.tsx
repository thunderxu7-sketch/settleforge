import { FC, memo } from 'react';

import { AddressBookItemType } from '../../../../../store/slices/address_book';
import AddressBookForm from '../../components/AddressBookForm';

import styles from '../AddressBookPage.m.scss';

interface Props {
  handleAddAddressBookItem: (addressBookItem: AddressBookItemType) => void;
  toggleAddressBookModal: () => void;
}

const AddressBookModal: FC<Props> = ({ handleAddAddressBookItem, toggleAddressBookModal }) => {
  return (
    <div className={styles.addAddressModal}>
      <div className={styles.addAddress}>
        <div className={styles.close} onClick={toggleAddressBookModal}>
          <i></i>
        </div>
        <div className={styles.title}>
          <AddressBookForm onSubmit={handleAddAddressBookItem} />
        </div>
      </div>
    </div>
  );
};

export default memo(AddressBookModal);
