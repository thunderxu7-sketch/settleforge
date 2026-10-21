import { useContext, useEffect, useState } from 'react';

import { callGetIsAuthedService } from '../service/get_is_authed_service';
import { MessageNode } from '../lib/bg_msg';
import { useAppSelector } from '../store/hooks';
import { selectCheckAuthed } from '../store/slices/notification';
import { AuthContext } from '../context/auth_context';

export const useAuth = (msgNode: MessageNode) => {
  const [isAuthed, setIsAuthed] = useState<boolean | undefined>(undefined);
  const checkAuthed = useAppSelector(selectCheckAuthed);

  useEffect(() => {
    (async () => {
      const { isAuthed } = await callGetIsAuthedService(msgNode);
      setIsAuthed(isAuthed);
    })();
  }, [checkAuthed]);

  return {
    isAuthed,
  };
};

export const useGlobalIsAuthed = () => {
  const authContextObj = useContext(AuthContext);

  return authContextObj.isAuthed;
};

export const useGlobalHasAddress = () => {
  const authContextObj = useContext(AuthContext);

  return authContextObj.hasAddress;
};
