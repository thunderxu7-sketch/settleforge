import { ChangeEvent, useCallback, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
// @ts-ignore
import TronWeb from 'tronweb';
import log from 'loglevel';

import { msgNode } from '../../../inst';
import Toast from '../../../../components/Toast';
import { useSaveLatestLocation } from '../../../../hooks/location';
import PAGES from '../../../../constants/pages';
import { escapeRegex } from '../../../utils';
import { useAppSelector } from '../../../../store/hooks';
import { AddressBookItemType, selectAddressBook } from '../../../../store/slices/address_book';
import { callSetAddressBookItemService } from '../../../../service/set_address_book_item_service';

interface State {
  searchKeyWord: string;
  showAddressBookModal: boolean;
  filterAddressBook: AddressBookItemType[];
}

const initialState: State = {
  searchKeyWord: '',
  showAddressBookModal: false,
  filterAddressBook: [],
};

type Action =
  | { type: 'SET_SEARCH_KEY_WORD'; payload: string }
  | { type: 'TOGGLE_ADDRESS_BOOK_MODAL' }
  | { type: 'SET_FILTER_ADDRESS_BOOK'; payload: AddressBookItemType[] };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_SEARCH_KEY_WORD':
      return {
        ...state,
        searchKeyWord: action.payload,
      };
    case 'TOGGLE_ADDRESS_BOOK_MODAL':
      return {
        ...state,
        showAddressBookModal: !state.showAddressBookModal,
      };
    case 'SET_FILTER_ADDRESS_BOOK':
      return {
        ...state,
        filterAddressBook: action.payload,
      };

    default:
      return state;
  }
};

const useAddressBookBiz = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const addressBook = useAppSelector(selectAddressBook) as { [k: string]: AddressBookItemType };
  const { formatMessage } = useIntl();
  useSaveLatestLocation();

  useEffect(() => {
    try {
      let value = state.searchKeyWord;
      const filterAddressBook: AddressBookItemType[] = [];
      if (value === '') {
        dispatch({
          type: 'SET_FILTER_ADDRESS_BOOK',
          payload: Object.values(addressBook) ?? [],
        });

        return;
      }

      if (TronWeb.isAddress(value)) {
        const bookInfo = addressBook[value];
        if (bookInfo) {
          filterAddressBook.push(bookInfo);
        }
      } else {
        if (/^([\u4e00-\u9fa5a-zA-Z0-9\d\s])+$/.test(value)) {
          value = escapeRegex(value);
          const reg = new RegExp(`(${value})`, 'i');
          for (const item in addressBook) {
            if (addressBook[item]?.name.match(reg)) {
              filterAddressBook.push(addressBook[item]);
            }
          }
        }
      }

      dispatch({
        type: 'SET_FILTER_ADDRESS_BOOK',
        payload: filterAddressBook,
      });
    } catch (error) {
      log.error('filterAddressBook error: ', error);
    }
  }, [state.searchKeyWord, addressBook]);

  const setSearchKeyWord = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'SET_SEARCH_KEY_WORD',
      payload: event.currentTarget.value.trim(),
    });
  }, []);

  const toggleAddressBookModal = useCallback(() => {
    dispatch({
      type: 'TOGGLE_ADDRESS_BOOK_MODAL',
    });
  }, []);

  const gotoAddressBookDetail = useCallback(
    (address: string) => {
      navigate(`${PAGES.PAGE_ADDRESS_BOOK}/detail`, { state: addressBook[address] });
    },
    [navigate, addressBook],
  );

  const handleAddAddressBookItem = useCallback(
    async (addressBookItem: AddressBookItemType) => {
      try {
        await callSetAddressBookItemService(msgNode, addressBookItem);

        dispatch({
          type: 'TOGGLE_ADDRESS_BOOK_MODAL',
        });

        dispatch({
          type: 'SET_SEARCH_KEY_WORD',
          payload: '',
        });

        Toast.show({
          icon: 'success',
          content: formatMessage({ id: 'TOAST.ADDED' }),
        });
      } catch (error) {
        log.error('handleAddAddressBookItem error: ', error);
      }
    },

    [formatMessage],
  );

  return {
    state,
    addressBook,
    setSearchKeyWord,
    toggleAddressBookModal,
    gotoAddressBookDetail,
    handleAddAddressBookItem,
  };
};

export default useAddressBookBiz;
