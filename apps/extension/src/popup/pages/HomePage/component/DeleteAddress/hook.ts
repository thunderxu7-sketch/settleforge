import { useCallback, useEffect, useState } from 'react';

import { msgNode } from '../../../../inst';
import { callDeleteAddressService } from '../../../../../service/delete_address_service';
import { setGaEvent } from '../../../../utils/gaUtils';
import Toast from '../../../../../components/Toast';
import { useNavigate } from 'react-router';
import PAGES from '../../../../../constants/pages';

export const useDeleteAddress = (
  visible: boolean,
  toggleVisible: any,
  updateDeleteAddress: any,
  selectedAddress: string,
) => {
  const navigate = useNavigate();
  const [isOnlyOne, setIsOnlyOne] = useState<boolean>(false);

  useEffect(() => {
    setIsOnlyOne(false);
  }, [visible]);

  const submit = useCallback(async () => {
    const res = await callDeleteAddressService(msgNode).catch((error) => {
      if (error.message === 'ALERT.DELETE_ACCOUNT.ONLY_ONE') {
        setIsOnlyOne(true);
      } else if (error.message === 'ERRORS.INVALID_PASSWORD_RETRY') {
        navigate(PAGES.PAGE_LOGIN);
      }
    });
    if (res) {
      Toast.show({
        icon: 'loading',
        content: '',
        duration: 0,
      });
      updateDeleteAddress(selectedAddress);
      toggleVisible();
      setGaEvent('Delete Account', 'Delete Account Confirm', 'Delete Account Confirm');
    }
    setTimeout(() => {
      Toast.hide();
    }, Math.round(Math.random() * 400) + 1300);
  }, [visible, updateDeleteAddress, toggleVisible, selectedAddress]);

  return {
    submit,
    isOnlyOne,
  };
};
