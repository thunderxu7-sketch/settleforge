import { useAppSelector } from '../store/hooks';
import { selectAddressInfo } from '../store/slices/address_info';

export const useSelectedAddressItem = () => {
  const addressInfo = useAppSelector(selectAddressInfo);

  const selectedAddress = addressInfo.selectedAddress;
  const selectedAddressItem = addressInfo?.addressItems[selectedAddress];

  return {
    selectedAddress,
    selectedAddressItem,
  };
};
