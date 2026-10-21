import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import Button from '../../../../../components/Button';

import styles from '../AddressBookDetailPage.m.scss';

import delImg2 from '../images/icon-delete-address.svg';

interface Props {
  handleDeleteAddressBookItem: () => void;
  toggleDeleteAddressBookItemPopup: () => void;
}

const DeleteAddressBookItemPopup: FC<Props> = ({
  handleDeleteAddressBookItem,
  toggleDeleteAddressBookItemPopup,
}) => {
  return (
    <div className={styles.popUp}>
      <div className={styles.deleteBook}>
        <div className={styles.title}>
          <span>
            <FormattedMessage id="SETTING.TITLE.ADDRESS_BOOK.CONFIRM_DELETE" />
          </span>
        </div>
        <img src={delImg2} alt="del" className={styles.img} />
        <div className={styles.txt}>
          <FormattedMessage id="SETTING.TITLE.ADDRESS_BOOK.CONFIRM_DELETE.BODY" />
        </div>
        <div className={styles.buttonRow}>
          <div className={styles.buttonWrap}>
            <Button id="BUTTON.CANCEL" onClick={toggleDeleteAddressBookItemPopup} tabIndex={1} />
          </div>
          <div className={styles.buttonWrap}>
            <Button
              id="BUTTON.CONFIRM"
              onClick={() => {
                handleDeleteAddressBookItem();
              }}
              tabIndex={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DeleteAddressBookItemPopup);
