import log from 'loglevel';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import PAGES from '../constants/pages';
import { msgNode } from '../popup/inst';
import { callGetIsAuthedService } from '../service/get_is_authed_service';
import { useGlobalHasAddress } from './auth';

// Check login status before all major actions
const useCheckLoginBeforeAction = (func: (...args: any[]) => void | Promise<void>) => {
  const navigate = useNavigate();
  const hasAddress = useGlobalHasAddress();
  return useCallback(
    async (...args: any[]) => {
      const { isAuthed } = await callGetIsAuthedService(msgNode);
      if (!isAuthed && hasAddress) {
        navigate(PAGES.PAGE_LOGIN);
        return;
      }
      try {
        func(...args);
      } catch (e: any) {
        log.error(e);
      }
    },
    [func, hasAddress],
  );
};

export default useCheckLoginBeforeAction;
