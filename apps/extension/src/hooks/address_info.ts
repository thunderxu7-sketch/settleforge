import { useCallback } from 'react';
import _ from 'lodash';

import { useAppSelector } from '../store/hooks';
import { selectAddressInfo } from '../store/slices/address_info';

export const useAddressInfo = () => {
  const addressInfo = useAppSelector(selectAddressInfo);

  const checkNameExist = useCallback(
    (name: string): boolean => {
      const item = _.values(addressInfo.addressItems).find((ele) => ele.name == name);
      return !!item;
    },
    [addressInfo.addressItems],
  );

  const getNameByAddress = useCallback(
    (address: string): string => {
      const item = _.values(addressInfo.addressItems).find((ele) => ele.address == address);
      return String(item?.name);
    },
    [addressInfo.addressItems],
  );

  const checkAccountExist = useCallback((): boolean => {
    return _.size(addressInfo.addressItems) > 0;
  }, [addressInfo.addressItems]);

  return {
    addressInfo,
    checkNameExist,
    getNameByAddress,
    checkAccountExist,
  };
};
