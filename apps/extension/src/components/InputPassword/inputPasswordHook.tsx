import { useCallback, useEffect, useState } from 'react';

import { useAddressInfo } from '../../hooks/address_info';

export const useInputPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidPassword, setValidPassword] = useState(false);
  const [isSamePassword, setSamePassword] = useState(true);
  const [isNeedPassword, setNeedPassword] = useState(true);

  const { checkAccountExist } = useAddressInfo();

  //TODO
  const onChangePasswordState = useCallback((state: any) => {
    if ('password' in state) {
      setPassword(state.password);
    }
    if ('isValidPassword' in state) {
      setValidPassword(state.isValidPassword);
    }
    if ('isSamePassword' in state) {
      setSamePassword(state.isSamePassword);
    }
    if ('confirmPassword' in state) {
      setConfirmPassword(state.confirmPassword);
    }
  }, []);

  useEffect(() => {
    setNeedPassword(!checkAccountExist());
  }, []);

  return {
    password,
    confirmPassword,
    isValidPassword,
    isSamePassword,
    isNeedPassword,
    setNeedPassword,

    onChangePassword: setPassword, // set password directly
    onChangePasswordState,
  };
};
