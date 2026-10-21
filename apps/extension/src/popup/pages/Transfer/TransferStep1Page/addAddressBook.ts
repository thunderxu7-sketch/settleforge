import { useReducer } from 'react';
import _ from 'lodash';

import { useAppSelector } from '../../../../store/hooks';
import { AddressBookItemType, selectAddressBook } from '../../../../store/slices/address_book';

export interface Label {
  name: string;
  value: string;
  type: string;
  state: string;
  placeholder: string;
  maxLength: number;
}

interface State {
  addressBookItem: Label[];
}

const initialState: State = {
  addressBookItem: [
    {
      name: 'SETTING.TITLE.ADDRESS_BOOK.NAME',
      value: '',
      type: 'name',
      state: '',
      placeholder: 'SETTING.TITLE.ADDRESS_BOOK.NAME.PLACEHOLDER',
      maxLength: 20,
    },
    {
      name: 'SETTING.TITLE.ADDRESS_BOOK.DESC',
      value: '',
      type: 'remarks',
      state: '',
      placeholder: 'ADDRESS_BOOK.REMARKS.LIMIT',
      maxLength: 60,
    },
  ],
};

type Action = { type: 'UPDATE_ADDRESS_BOOK_ITEM_LABEL'; payload: Label } | { type: 'RESET_LABEL' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'UPDATE_ADDRESS_BOOK_ITEM_LABEL': {
      const { type } = action.payload;
      const newAddressBookItem = _.cloneDeep(state.addressBookItem);
      newAddressBookItem.forEach((item, index) => {
        if (item.type === type) {
          newAddressBookItem.splice(index, 1, action.payload);
        }
      });

      return {
        ...state,
        addressBookItem: newAddressBookItem,
      };
    }
    case 'RESET_LABEL': {
      const newAddressBookItem = state.addressBookItem.map((item) => {
        item.value = '';
        item.state = '';
        return item;
      });

      return {
        ...state,
        addressBookItem: newAddressBookItem,
      };
    }

    default:
      return state;
  }
};

const useAddressBookFormBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const addressBook = useAppSelector(selectAddressBook) as { [k: string]: AddressBookItemType };

  const resetLabel = () => {
    dispatch({ type: 'RESET_LABEL' });
  };

  const handleNameLabelChange = (value: string) => {
    const newNameLabel = _.cloneDeep(state.addressBookItem[0]);
    newNameLabel.value = value.trim();
    newNameLabel.state = '';

    if (value.length <= 0) {
      newNameLabel.state = '';
      dispatch({
        type: 'UPDATE_ADDRESS_BOOK_ITEM_LABEL',
        payload: newNameLabel,
      });

      return;
    }
    if (!/^([\u4e00-\u9fa5a-zA-Z0-9\d\s])+$/.test(value)) {
      newNameLabel.state = 'EXCEPTION.ADD_ADDRESS_BOOK.IS_ALPHANUMERIC';
    } else {
      let oldItem;
      for (const item in addressBook) {
        if (addressBook[item].name === value) {
          oldItem = addressBook[item];
        }
      }
      if (oldItem) {
        newNameLabel.state = 'EXCEPTION.ADD_ADDRESS_BOOK.IS_UNIQUE2';
      }
    }

    dispatch({
      type: 'UPDATE_ADDRESS_BOOK_ITEM_LABEL',
      payload: newNameLabel,
    });
  };

  const handleRemarksLabelChange = (value: string) => {
    const newRemarksLabel = _.cloneDeep(state.addressBookItem[1]);
    newRemarksLabel.value = value.trim();
    newRemarksLabel.state = '';

    if (value) {
      if (!/^([\u4e00-\u9fa5a-zA-Z0-9\d\s])+$/.test(value)) {
        newRemarksLabel.state = 'EXCEPTION.ADD_ADDRESS_BOOK.IS_ALPHANUMERIC';
      }
    }

    dispatch({
      type: 'UPDATE_ADDRESS_BOOK_ITEM_LABEL',
      payload: newRemarksLabel,
    });
  };

  return {
    state,
    resetLabel,
    handleNameLabelChange,
    handleRemarksLabelChange,
  };
};

export default useAddressBookFormBiz;
