import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Input, Modal } from 'antd';

import useAddressBookFormBiz from '../addAddressBook';
import { cutMiddle } from '../../../../utils';

import styles from '../TransferStep1Page.m.scss';

import CloseModal from '../images/icon-close-modal.svg';

const { TextArea } = Input;

interface Props {
  showAddAddressBook: boolean;
  address: string;

  onConfirm: (name: string, address: string, remarks: string) => void;
  onCancel: () => void;
}

const AddAddressBook: FC<Props> = ({ address, showAddAddressBook, onConfirm, onCancel }) => {
  const { formatMessage } = useIntl();

  const { state, resetLabel, handleNameLabelChange, handleRemarksLabelChange } =
    useAddressBookFormBiz();
  const { addressBookItem } = state;

  let isValid = true;
  addressBookItem.map((label, index) => {
    if (index === 2 && label.state !== '') {
      isValid = false;
    }
    if (index === 0 && (label.value === '' || label.state !== '')) {
      isValid = false;
    }
    return;
  });

  return (
    <Modal
      visible={showAddAddressBook}
      okText={formatMessage({ id: 'BUTTON.CONFIRM' })}
      cancelText={formatMessage({ id: 'BUTTON.CANCEL' })}
      closeIcon={<img src={CloseModal} alt="" />}
      okButtonProps={{
        disabled: !isValid,
        type: isValid ? undefined : 'text',
      }}
      getContainer={() => {
        return document.querySelector('#transferStep1') ?? document.body;
      }}
      onOk={() => {
        onConfirm(addressBookItem[0].value, address, addressBookItem[1].value);

        resetLabel();
      }}
      onCancel={() => {
        onCancel();

        resetLabel();
      }}
    >
      <div className={styles.addAddressBook}>
        <h1 className={styles.addAddressBookTitle}>
          <FormattedMessage id="ACCOUNT.SEND.ADDRESS_BOOK" />
        </h1>

        <div className={styles.addAddressBookContent}>
          <div className={styles.addAddressBookAddress}>
            <span>
              <FormattedMessage id="SETTING.TITLE.ADDRESS_BOOK.ADDRESS" />:
            </span>
            <span>{cutMiddle(address, 6, 6)}</span>
          </div>
          <div className={styles.addAddressBookName}>
            <span>
              <FormattedMessage id="SETTING.TITLE.ADDRESS_BOOK.NAME" />:
            </span>
            <Input
              allowClear
              value={addressBookItem[0].value}
              onChange={(e) => {
                handleNameLabelChange(e.target.value);
              }}
              maxLength={20}
              placeholder={formatMessage({ id: addressBookItem[0].placeholder })}
            />

            {addressBookItem[0].state.length > 0 && (
              <p className={styles.inputCriteria}>
                <FormattedMessage id={addressBookItem[0].state} />
              </p>
            )}
          </div>
          <div className={styles.addAddressBookRemarks}>
            <span>
              <FormattedMessage id="SETTING.TITLE.ADDRESS_BOOK.DESC" />:
            </span>
            <div className={styles.textWrap}>
              <TextArea
                value={addressBookItem[1].value}
                maxLength={60}
                onChange={(e) => {
                  handleRemarksLabelChange(e.target.value);
                }}
                placeholder={formatMessage({ id: addressBookItem[1].placeholder })}
              ></TextArea>
            </div>
            {addressBookItem[1].state.length > 0 && (
              <p className={styles.inputCriteria}>
                <FormattedMessage id={addressBookItem[1].state} />
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default memo(AddAddressBook);
