import { useCallback, useEffect, useReducer } from 'react';

import { chromeStorage } from '../../lib/storage';
import { WALLET_VERSION } from '../../constants/storage_keys';
import packageInfo from '../../../package.json';

interface StorageVersion {
  [k: string]: boolean;
}
interface State {
  isVisible: boolean;
}

const initialState: State = {
  isVisible: false,
};

type Action = {
  type: 'SET_SHOW_VERSION_UPDATE_MODAL';
  payload: boolean;
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_SHOW_VERSION_UPDATE_MODAL': {
      return {
        ...state,
        isVisible: action.payload,
      };
    }

    default:
      return state;
  }
};

export const useVersionUpdateModal = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const storageVersion: StorageVersion = (await getWalletVersion()) ?? {};

      if (!storageVersion[packageInfo.version]) {
        dispatch({
          type: 'SET_SHOW_VERSION_UPDATE_MODAL',
          payload: true,
        });
      }
    })();
  }, []);

  const setWalletVersion = useCallback(async () => {
    const storageVersion: StorageVersion = (await getWalletVersion()) ?? {};
    storageVersion[packageInfo.version] = true;

    chromeStorage.setItem(WALLET_VERSION, storageVersion);
  }, []);

  const getWalletVersion: () => Promise<StorageVersion> = useCallback(async () => {
    return await chromeStorage.getItem(WALLET_VERSION);
  }, []);

  const onConfirm = useCallback(() => {
    dispatch({
      type: 'SET_SHOW_VERSION_UPDATE_MODAL',
      payload: false,
    });

    setWalletVersion();
  }, []);

  return {
    state,
    onConfirm,
  };
};
