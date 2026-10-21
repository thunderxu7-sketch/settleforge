import { useEffect, useMemo, useRef, useState } from 'react';
import type { Location } from 'react-router';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router-dom';
import _ from 'lodash';
import log from 'loglevel';

import { chromeStorage } from '../lib/storage';
import { LATEST_LOCATION, SECONDARY_POPUP_LATEST_LOCATION } from '../constants/storage_keys';
import {
  selectCheckRedirect,
  selectCheckSecondaryPopupRedirect,
} from '../store/slices/notification';
import { useAppSelector } from '../store/hooks';
import PAGES from '../constants/pages';
import { useGlobalHasAddress, useGlobalIsAuthed } from './auth';

type LatestLocationType = Pick<Location, 'pathname' | 'state'>;

export const useSaveLatestLocation = () => {
  const location = useLocation();

  // initial
  useEffect(() => {
    log.debug('useSaveLatestLocation', location);
    (async () => {
      await chromeStorage.setItem(LATEST_LOCATION, {
        pathname: location.pathname,
        state: location.state,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export const useShouldNavigateLoginPage = () => {
  const isAuthed = useGlobalIsAuthed();
  const hasAddress = useGlobalHasAddress();
  const shouldNavigateLoginPage = useMemo(() => !isAuthed && hasAddress, [isAuthed, hasAddress]);
  return shouldNavigateLoginPage;
};

export const useRestoreLatestLocation = () => {
  const [isDone, setDone] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const checkRedirect = useAppSelector(selectCheckRedirect);

  // initial
  useEffect(() => {
    (async () => {
      const latestLocation = await chromeStorage.getItem<LatestLocationType>(LATEST_LOCATION);
      log.debug('***** latestLocation', latestLocation);
      if (
        latestLocation &&
        (latestLocation.pathname != location.pathname ||
          !_.isEqual(latestLocation.state, location.state))
      ) {
        // goto last access page
        navigate(latestLocation.pathname, { state: latestLocation.state });
      }
      setDone(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkRedirect]);

  return isDone;
};

export const updateLocationState = async <T>(state: T, merge = true) => {
  const oldInfo = await chromeStorage.getItem<LatestLocationType>(LATEST_LOCATION);
  let newState = state;
  if (merge) {
    if (_.isObject(oldInfo.state)) {
      newState = {
        ...oldInfo.state,
        ...state,
      };
    }
  }
  await chromeStorage.setItem(LATEST_LOCATION, {
    pathname: oldInfo.pathname,
    state: newState,
  });
};

export const getLocationState = async (): Promise<LatestLocationType> => {
  const res = await chromeStorage.getItem<LatestLocationType>(LATEST_LOCATION);
  return res;
};

export const clearLatestLocationState = async (): Promise<void> => {
  await chromeStorage.removeItem(LATEST_LOCATION);
};

export const useSecondaryPopupRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const checkSecondaryPopupRedirect = useAppSelector(selectCheckSecondaryPopupRedirect);
  const isFirstRun = useRef(true);

  // initial
  useEffect(() => {
    (async () => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }
      const latestLocation = await chromeStorage.getItem<LatestLocationType>(
        SECONDARY_POPUP_LATEST_LOCATION,
      );
      if (
        latestLocation &&
        (latestLocation.pathname != location.pathname ||
          !_.isEqual(latestLocation.state, location.state))
      ) {
        navigate(latestLocation.pathname, { state: latestLocation.state });
      }
    })();
  }, [checkSecondaryPopupRedirect]);
};
