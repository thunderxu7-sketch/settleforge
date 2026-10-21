import { useAppSelector } from '../store/hooks';
import { selectAddressBook } from '../store/slices/address_book';

export const useAddressBooks = () => {
  const addressBooks = useAppSelector(selectAddressBook);

  return {
    addressBooks,
  };
};
