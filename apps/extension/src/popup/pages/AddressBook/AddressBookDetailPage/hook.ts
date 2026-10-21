import { useCallback, useReducer } from 'react';
import { useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router';

import { msgNode } from '../../../inst';
import Toast from '../../../../components/Toast';
import { AddressBookItemType } from '../../../../store/slices/address_book';
import { callSetAddressBookItemService } from '../../../../service/set_address_book_item_service';
import { callDeleteAddressBookItemService } from '../../../../service/delete_address_book_item_service';

interface State {
  showDeletePopup: boolean;
}

const initialState: State = {
  showDeletePopup: false,
};

type Action = { type: 'TOGGLE_SHOW_DELETE_POPUP' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'TOGGLE_SHOW_DELETE_POPUP':
      return {
        ...state,
        showDeletePopup: !state.showDeletePopup,
      };
    default:
      return state;
  }
};

const useAddressBookBiz = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const [state, dispatch] = useReducer(reducer, initialState);
  const location = useLocation() as { state: AddressBookItemType };

  const handleUpdateAddressBookItem = useCallback(
    async (addressBookItem: AddressBookItemType) => {
      await callSetAddressBookItemService(msgNode, addressBookItem);
      navigate(-1);

      Toast.show({
        icon: 'success',
        content: formatMessage({ id: 'TOAST.UPDATE' }),
      });
    },
    [navigate, formatMessage],
  );

  const handleDeleteAddressBookItem = useCallback(async () => {
    await callDeleteAddressBookItemService(msgNode, location.state?.address);
    dispatch({
      type: 'TOGGLE_SHOW_DELETE_POPUP',
    });
    navigate(-1);
  }, [navigate, location.state]);

  const toggleDeleteAddressBookItemPopup = useCallback(() => {
    dispatch({
      type: 'TOGGLE_SHOW_DELETE_POPUP',
    });
  }, []);

  return {
    state,
    handleUpdateAddressBookItem,
    handleDeleteAddressBookItem,
    toggleDeleteAddressBookItemPopup,
  };
};

export default useAddressBookBiz;
