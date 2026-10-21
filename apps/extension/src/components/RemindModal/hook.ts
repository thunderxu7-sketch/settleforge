import { useCallback, useReducer } from 'react';
import { callGetAccountRemindStatusService } from '../../service/get_account_remind_status_service';
import { msgNode } from '../../popup/inst';
import { useAppSelector } from '../../store/hooks';
import { selectSelectedAddress } from '../../store/slices/address_info';
import { useNavigate } from 'react-router';
import PAGES from '../../constants/pages';

interface State {
  isVisible: boolean;
  displayType: 1 | 2;
  toCopyAddress?: string;
}

const initialState: State = {
  isVisible: false,
  displayType: 1,
};

type Action =
  | {
      type: 'SHOW';
      payload: {
        displayType: 1 | 2;
        toCopyAddress?: string;
      };
    }
  | {
      type: 'HIDE';
    };

export type FuncCheckAndShowRemindModal = (
  displayType: 1 | 2,
  toCopyAddress?: string,
) => Promise<boolean>;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SHOW': {
      return {
        ...state,
        isVisible: true,
        ...action.payload,
      };
    }
    case 'HIDE': {
      return {
        ...state,
        isVisible: false,
      };
    }
    default:
      return state;
  }
};

export const useRemindModal = (changeAddress?: (address: string) => void) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const selectedAddress = useAppSelector(selectSelectedAddress);

  const checkAndShow = useCallback(
    async (displayType: 1 | 2, toCopyAddress?: string): Promise<boolean> => {
      const { remind } = await callGetAccountRemindStatusService(msgNode, {
        address: toCopyAddress || selectedAddress,
      });

      if (remind) {
        dispatch({
          type: 'SHOW',
          payload: {
            displayType,
            toCopyAddress,
          },
        });
      }
      return remind;
    },
    [selectedAddress],
  );

  const hide = useCallback(() => {
    dispatch({
      type: 'HIDE',
    });
  }, []);

  const gotoBackup = useCallback(() => {
    if (state.displayType == 1) {
      navigate(PAGES.PAGE_SAVE_MNEMONIC);
      return;
    }
    if (state.displayType == 2) {
      if (state.toCopyAddress == selectedAddress) {
        navigate(PAGES.PAGE_SAVE_MNEMONIC);
        return;
      } else {
        dispatch({
          type: 'HIDE',
        });
        if (changeAddress) {
          changeAddress(state.toCopyAddress!);
        }
      }
    }
  }, [navigate, state.displayType, changeAddress, state.toCopyAddress, selectedAddress]);

  return {
    isRemindModalVisible: state.isVisible,
    remindModalType: state.displayType,
    checkAndShowRemindModal: checkAndShow,
    onRemindModalCancel: hide,
    onRemindModalConfirm: gotoBackup,
  };
};
