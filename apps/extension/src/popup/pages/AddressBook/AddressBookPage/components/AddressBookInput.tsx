import { ChangeEvent, FC, memo } from 'react';
import { Input } from 'antd';
import { useIntl } from 'react-intl';

import styles from '../AddressBookPage.m.scss';

import Search from '../images/icon-search-address.svg';

interface Props {
  searchKeyWord: string;
  setSearchKeyWord: (event: ChangeEvent<HTMLInputElement>) => void;
}

const AddressBookInput: FC<Props> = ({ searchKeyWord, setSearchKeyWord }) => {
  const { formatMessage } = useIntl();

  return (
    <Input
      allowClear
      prefix={<img src={Search} className={styles.searchInputIcon} alt="" />}
      value={searchKeyWord}
      type="text"
      onChange={setSearchKeyWord}
      placeholder={formatMessage({ id: 'SETTING.TITLE.ADDRESS_BOOK.SEARCH' })}
      className={styles.searchInput}
    />
  );
};

export default memo(AddressBookInput);
