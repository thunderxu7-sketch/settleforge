import { FC, memo } from 'react';
// @ts-ignore
import dayjs from 'dayjs';
import classNames from 'classnames';

import { Address } from '../hook';
import { cutMiddle } from '../../../../utils';

import styles from '../TransferStep1Page.m.scss';

interface Props {
  data: Address;
  nameIndex: number;
  addressIndex: number;
  searchKey: string;
  setShowAddress: (value: string) => void;
}

const AddressCollectionItem: FC<Props> = ({
  data,
  nameIndex,
  addressIndex,
  searchKey,
  setShowAddress,
}) => {
  const { showAddress, name, address, remarks, timestamp } = data;

  return (
    <div
      className={styles.addressItem}
      onClick={() => {
        setShowAddress(showAddress);
      }}
    >
      <div className={styles.showAddress}>
        <div className={classNames(styles.name, name === address && styles.recent)}>
          {name.substring(0, nameIndex)}
          <span className={styles.search}>
            {name.substring(nameIndex, nameIndex + searchKey.length)}
          </span>
          {name.substring(nameIndex + searchKey.length, name.length)}
        </div>
        {name !== address && (
          <div className={styles.address}>
            ({createAdressText(address, addressIndex, searchKey.length)})
          </div>
        )}
      </div>
      {timestamp !== undefined && (
        <p className={styles.recentTime}> {dayjs(timestamp).format('YYYY-MM-DD HH:mm')}</p>
      )}
      {remarks !== undefined && <p className={styles.remarks}>{remarks}</p>}
    </div>
  );
};

function createSelectedAdressText(
  address: string,
  start: number,
  end: number,
  addressIndex: number,
  searchKeyLength: number,
) {
  return (
    <>
      {address.substring(start, addressIndex)}
      <span className={styles.search}>
        {address.substring(addressIndex, addressIndex + searchKeyLength)}
      </span>
      {address.substring(addressIndex + searchKeyLength, end)}
    </>
  );
}

function createAdressText(address: string, addressIndex: number, searchKeyLength: number) {
  const addressLength = address.length;
  if (addressIndex == -1) {
    return <>{cutMiddle(address, 6, 6)}</>;
  } else if (addressIndex + searchKeyLength <= 6) {
    return (
      <>
        {createSelectedAdressText(address, 0, 6, addressIndex, searchKeyLength)}...
        {address.substring(addressLength - 6, addressLength)}
      </>
    );
  } else if (addressIndex >= address.length - 6) {
    return (
      <>
        {address.substring(0, 6)}...
        {createSelectedAdressText(
          address,
          address.length - 6,
          address.length,
          addressIndex,
          searchKeyLength,
        )}
      </>
    );
  } else {
    return <span className={styles.search}>{cutMiddle(address, 6, 6)}</span>;
  }
}
export default memo(AddressCollectionItem);
