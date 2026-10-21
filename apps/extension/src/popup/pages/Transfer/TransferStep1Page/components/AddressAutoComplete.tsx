import { FC, memo } from 'react';

import { Address } from '../hook';
import AddressCollectionItem from './AddressCollectionItem';

import styles from '../TransferStep1Page.m.scss';

interface Props {
  searchKey: string;
  searchResult: Set<Address>;
  setShowAddress: (value: string) => void;
}

const AddressAutoComplete: FC<Props> = ({ searchKey, searchResult, setShowAddress }) => {
  const searchResultArr = [...searchResult];

  return (
    <div className={styles.addressAutoComplete}>
      <div className={styles.addressList}>
        {searchResultArr.map((item) => {
          const { showAddress, name, address } = item;
          const nameUpperCase = name.toUpperCase();
          const searchKeyUpperCase = searchKey.toUpperCase();
          const addressUpperCase = address.toUpperCase();
          const addressIndex = addressUpperCase.indexOf(searchKeyUpperCase);
          let nameIndex = nameUpperCase.indexOf(searchKeyUpperCase);
          nameIndex = nameIndex === -1 ? nameUpperCase.length : nameIndex;

          return (
            <AddressCollectionItem
              key={showAddress}
              data={item}
              nameIndex={nameIndex}
              addressIndex={addressIndex}
              searchKey={searchKeyUpperCase}
              setShowAddress={setShowAddress}
            />
          );
        })}
      </div>
    </div>
  );
};

export default memo(AddressAutoComplete);
