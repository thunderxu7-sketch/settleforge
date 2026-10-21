import { FC, memo } from 'react';

import useAddressBookFormBiz from './hook';
import type { AddressBookItemType } from '../../../../../store/slices/address_book';
import ValidLabelItem from './ValidLabelItem';
import Button from '../../../../../components/Button';

import styles from './AddressBookForm.m.scss';

interface Props {
  onSubmit: (show: AddressBookItemType) => void;
}

const AddressBookForm: FC<Props> = ({ onSubmit }) => {
  const { state, handleNameLabelChange, handleAddressLabelChange, handleRemarksLabelChange } =
    useAddressBookFormBiz();
  const { addressBookItem } = state;

  let isValid = true;
  addressBookItem.map((label, index) => {
    if (index > 1) {
      if (label.state !== '') {
        isValid = false;
      }
    } else {
      if (label.value === '' || label.state !== '') {
        isValid = false;
      }
    }
    return;
  });

  return (
    <div className={styles.addressBookItem}>
      <div>
        <ValidLabelItem label={addressBookItem[0]} onChange={handleNameLabelChange} />
        <ValidLabelItem label={addressBookItem[1]} onChange={handleAddressLabelChange} />
        <ValidLabelItem label={addressBookItem[2]} onChange={handleRemarksLabelChange} />
      </div>
      <Button
        id="SETTING.TITLE.ADDRESS_BOOK.SAVE"
        isValid={isValid}
        onClick={() => {
          onSubmit({
            name: addressBookItem[0].value,
            address: addressBookItem[1].value,
            remarks: addressBookItem[2].value,
          });
        }}
      />
    </div>
  );
};

export default memo(AddressBookForm);
