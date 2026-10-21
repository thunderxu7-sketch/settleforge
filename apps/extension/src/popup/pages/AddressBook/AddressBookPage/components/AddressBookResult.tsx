import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import { AddressBookItemType } from '../../../../../store/slices/address_book';

import styles from '../AddressBookPage.m.scss';

interface Props {
  searchKeyWord: string;
  filterAddressBook: AddressBookItemType[];
  gotoAddressBookDetail: (value: string) => void;
}

const AddressBookResult: FC<Props> = ({
  searchKeyWord,
  filterAddressBook,
  gotoAddressBookDetail,
}) => {
  return (
    <div>
      {filterAddressBook.map((item) => {
        const { name, address, remarks } = item;
        let index = 0;
        if (searchKeyWord) {
          index = name.toLowerCase().indexOf(searchKeyWord.toLowerCase());
          index = index !== -1 ? index : 35;
        }

        return (
          <div className={styles.item} key={address}>
            <div
              className={styles.r2}
              onClick={() => {
                gotoAddressBookDetail(address);
              }}
            >
              <div className={styles.addressName} title={name}>
                {searchKeyWord && searchKeyWord !== address ? (
                  <span>
                    {name?.substring(0, index)}
                    <span className={styles.search}>
                      {name?.substring(index, index + searchKeyWord.length)}
                    </span>
                    {name?.substring(index + searchKeyWord.length)}
                  </span>
                ) : (
                  <span>{name}</span>
                )}
              </div>
              <div className={styles.address}>
                {searchKeyWord === address ? (
                  <span className={styles.search}>{address}</span>
                ) : (
                  <span>{address}</span>
                )}
              </div>
              {remarks.length > 0 && (
                <div className={styles.remarks}>
                  <FormattedMessage id="SETTING.TITLE.ADDRESS_BOOK.DESC" />
                  {'：' + remarks}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(AddressBookResult);
