import { useCallback, useEffect, useReducer } from 'react';
import _ from 'lodash';
import { useNavigate } from 'react-router';

import { callGetWatchAssetService, TokenItemType } from '../../../service/get_watch_asset_service';
import { msgNode } from '../../../popup/inst';
import { usePricesInfo } from '../../../hooks/prices_info';
import { callAddWatchAssetService } from '../../../service/add_watch_asset_service';
import Toast from '../../../components/Toast';
import { useAppSelector } from '../../../store/hooks';
import { selectCheckWatchAsset } from '../../../store/slices/notification';
import { WindowType } from '../../../constants/types';
import PAGES from '../../../constants/pages';
import { callCloseWatchAssetService } from '../../../service/close_watch_asset_service';

interface State {
  tokens: TokenItemType[];
  isFailed: boolean;
  hostname: string;
  isValid: boolean;
}

const initialState: State = {
  tokens: [],
  isFailed: false,
  hostname: 'https://tronscan.org/#',
  isValid: true,
};

type Action = {
  type: 'INIT';
  payload: State;
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

export const useWatchAssetBiz = (windowType: WindowType) => {
  const navigate = useNavigate();
  const { pricesInfo } = usePricesInfo();

  const [state, dispatch] = useReducer(reducer, initialState);

  const isDisable = _.every(state.tokens, (ele: TokenItemType) => ele.isInAssets) || !state.isValid;

  const checkWatchAsset = useAppSelector(selectCheckWatchAsset);

  // initialize
  useEffect(() => {
    (async () => {
      Toast.show({
        icon: 'loading',
        duration: 0,
      });
      try {
        const res = await callGetWatchAssetService(msgNode);
        if (res.tokens.length == 0) {
          if (windowType == WindowType.POPUP) {
            await callCloseWatchAssetService(msgNode);
            navigate(PAGES.PAGE_HOMEPAGE);
            return;
          } else if (windowType == WindowType.SECONDARY) {
            window.close();
            return;
          }
        }
        dispatch({
          type: 'INIT',
          payload: {
            tokens: res.tokens,
            isValid: res.isValid,
            isFailed: res.isFailed,
            hostname: res.hostname,
          },
        });
      } catch (err: any) {
        // ignore
      }
      Toast.hide();
    })();
  }, [checkWatchAsset]);

  const addWatchAsset = useCallback(async (tokens?: TokenItemType[]) => {
    Toast.show({
      icon: 'loading',
      duration: 0,
    });
    try {
      await callAddWatchAssetService(msgNode, { tokens });
      if (!tokens) {
        window.close();
        return;
      }
    } catch (error: any) {
      window.close();
      return;
    }
    Toast.hide();
  }, []);

  return {
    state,
    pricesInfo,
    addWatchAsset,
    isDisable,
  };
};
