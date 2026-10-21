import { useCallback, useReducer } from 'react';
import { useIntl } from 'react-intl';

import { ConnectedWebsiteType } from '../../../../../store/slices/connected_website';
import { callDisconnectWebsiteService } from '../../../../../service/disconnect_website';
import { msgNode } from '../../../../inst';
import Toast from '../../../../../components/Toast';

interface State {
  isDeleteDialogVisible: boolean;
  toDeleteAddress: string;
  toDeleteWebInfo?: ConnectedWebsiteType;
}

const initialState: State = {
  isDeleteDialogVisible: false,
  toDeleteAddress: '',
  toDeleteWebInfo: undefined,
};

type Action =
  | {
      type: 'SHOW_DELETE_DIALOG';
      payload: Pick<State, 'toDeleteAddress' | 'toDeleteWebInfo'>;
    }
  | {
      type: 'HIDE_DELETE_DIALOG';
    };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SHOW_DELETE_DIALOG':
      return {
        ...state,
        isDeleteDialogVisible: true,
        ...action.payload,
      };
    case 'HIDE_DELETE_DIALOG':
      return {
        ...state,
        isDeleteDialogVisible: false,
        toDeleteAddress: '',
        toDeleteWebInfo: undefined,
      };
    default:
      return state;
  }
};

export const useDeleteWebsites = (onClose: () => void) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const intl = useIntl();

  const showDeleteDialog = useCallback((address: string, webInfo: ConnectedWebsiteType) => {
    dispatch({
      type: 'SHOW_DELETE_DIALOG',
      payload: {
        toDeleteAddress: address,
        toDeleteWebInfo: webInfo,
      },
    });
  }, []);

  const hideDeleteDialog = useCallback(() => {
    dispatch({
      type: 'HIDE_DELETE_DIALOG',
    });
    onClose();
  }, []);

  const disconnectWebsite = useCallback(async () => {
    Toast.show('');
    await callDisconnectWebsiteService(msgNode, {
      address: state.toDeleteAddress,
      webInfo: state.toDeleteWebInfo!,
    });
    dispatch({
      type: 'HIDE_DELETE_DIALOG',
    });
    onClose();
    Toast.show({
      content: intl.formatMessage({ id: 'ACCOUNT.AUTH_WEBSITE.ADDRESS.DISCONNECT.TIP' }),
      duration: 2000,
    });
  }, [state.toDeleteAddress, state.toDeleteWebInfo]);

  const disconnectWebsiteForAddress = useCallback(async () => {
    Toast.show('');
    await callDisconnectWebsiteService(msgNode, {
      address: state.toDeleteAddress,
      webInfo: state.toDeleteWebInfo!,
    });
    dispatch({
      type: 'HIDE_DELETE_DIALOG',
    });
    Toast.show({
      content: intl.formatMessage({ id: 'ACCOUNT.AUTH_WEBSITE.ADDRESS.DISCONNECT.TIP' }),
      duration: 2000,
    });
  }, [state.toDeleteAddress, state.toDeleteWebInfo]);

  return {
    state,
    showDeleteDialog,
    hideDeleteDialog,
    disconnectWebsite,
    disconnectWebsiteForAddress,
  };
};
