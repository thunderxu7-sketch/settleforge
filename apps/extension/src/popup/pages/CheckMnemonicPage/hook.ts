import { useCallback, useEffect, useReducer, useState } from 'react';
import _, { shuffle, size } from 'lodash';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

import Toast from '../../../components/Toast';
import { callUpdateAccountRemindStatusService } from '../../../service/update_account_remind_status_service';
import { msgNode } from '../../inst';
import { setAccountInfo } from '../../../hooks/account_info';
import PAGES from '../../../constants/pages';
import { supportStorageKey } from '../../../constants/wallet_type';
import { sleep } from '../../../lib/async_func';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';
import { callGetSelectedAccountService } from '../../../service/get_selected_account_service';

interface InitialState {
  passArr: number[];
  currentIndex: number;
  selectedIndex: number;
  mnemonics: string[];
  mnemonicChoices: string[];
}

const initialState = {
  passArr: [],
  currentIndex: null,
  selectedIndex: null,
  mnemonics: [],
  mnemonicChoices: [],
};
const reducer = (state: InitialState, action: { type: string; payload?: any }) => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        ...action.payload,
      };
    case 'CHECK_ANSWER':
      return {
        ...state,
        ...action.payload,
      };
    case 'SELECT_INDEX':
      return {
        ...state,
        selectedIndex: action.payload,
      };
    default:
      return state;
  }
};

export const useCheckMnemonicBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { formatMessage } = useIntl();
  const [address, setAddress] = useState<string>('');
  const navigate = useNavigate();

  const randomData = useCallback(
    (mnemonics: string[]) => {
      const { passArr } = state;
      let currentIndex = _.random(0, _.size(mnemonics) - 1);
      while (passArr.includes(currentIndex)) {
        currentIndex = _.random(0, _.size(mnemonics) - 1);
      }
      let mnemonicChoices = [mnemonics[currentIndex]];
      while (size(mnemonicChoices) < 6) {
        const index = _.random(0, _.size(mnemonics) - 1);
        const word = mnemonics[index];
        if (!mnemonicChoices.includes(word)) {
          mnemonicChoices.push(word);
        }
      }
      mnemonicChoices = shuffle(mnemonicChoices);
      return {
        currentIndex,
        mnemonicChoices,
      };
    },
    [state.passArr],
  );

  // initialize
  useEffect(() => {
    (async () => {
      const { selected } = await callGetSelectedAccountService(msgNode, {});
      const mnemonicStr = selected.selectedAccount?.mnemonicPhase;
      const mnemonics = _.split(mnemonicStr, ' ');
      setAddress(selected.selectedAddressItem?.address);
      dispatch({
        type: 'INIT',
        payload: {
          passArr: [],
          mnemonics,
          ...randomData(mnemonics),
        },
      });
    })();
  }, []);

  const checkAnswer = useCallback(async () => {
    const { currentIndex, passArr, mnemonics, selectedIndex, mnemonicChoices } = state;
    const word = mnemonics[currentIndex];
    const selectedWord = mnemonicChoices[selectedIndex];
    if (word === selectedWord) {
      passArr.push(currentIndex);
      if (size(passArr) === 3) {
        Toast.show({
          icon: 'success',
          content: formatMessage({ id: 'WALLET.BACKUP.MNEMONIC.SUCCESS' }),
        });

        // await PopupAPI.changeRemindStatus();
        const result = await callUpdateAccountRemindStatusService(msgNode, {
          address,
          remind: false,
        });
        await sleep(2000);
        if (result) {
          navigate(PAGES.PAGE_HOMEPAGE);
          await setAccountInfo(supportStorageKey.createWalletBackup, '');
          await setAccountInfo(supportStorageKey.exportType, '');
        }
        return;
      }
    } else {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'WALLET.BACKUP.MNEMONIC.ERROR' }),
      });
    }

    dispatch({
      type: 'CHECK_ANSWER',
      payload: {
        passArr,
        selectedIndex: null,
        ...randomData(state.mnemonics),
      },
    });
  }, [state, formatMessage, randomData]);

  const lookAgain = useCallback(async () => {
    await setAccountInfo(supportStorageKey.reLookMnemonic, 'true');
    // navigate(PAGES.PAGE_SAVE_MNEMONIC);
    navigate(-1);
  }, [navigate]);

  const onSelect = useCallback((selectedIndex) => {
    Toast.hide();
    dispatch({
      type: 'SELECT_INDEX',
      payload: selectedIndex,
    });
  }, []);

  return {
    state,
    checkAnswer: useCheckLoginBeforeAction(checkAnswer),
    lookAgain: useCheckLoginBeforeAction(lookAgain),
    onSelect,
  };
};
