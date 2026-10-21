import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { callAccountsTypeService } from '../../../service/accounts_type_service';
import { msgNode } from '../../inst';
import PAGES from '../../../constants/pages';
import { supportStorageKey } from '../../../constants/wallet_type';
import { setAccountInfo } from '../../../hooks/account_info';
import { useAppSelector } from '../../../store/hooks';
import { selectAddressInfo } from '../../../store/slices/address_info';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

export const useExportAccountBiz = () => {
  const navigate = useNavigate();

  const [hasMnemonic, setMnemonic] = useState(false);
  const { selectedAddress } = useAppSelector(selectAddressInfo);

  // initialize
  useEffect(() => {
    (async () => {
      const account = await callAccountsTypeService(msgNode);
      const accountType = account[selectedAddress];
      const hasMnemonic = accountType === 0;
      setMnemonic(hasMnemonic);
    })();
  }, [selectedAddress]);

  const goBack = useCallback(() => {
    navigate(PAGES.PAGE_HOMEPAGE);
  }, [navigate]);

  const gotoPage = useCallback(
    async (exportType: string) => {
      await setAccountInfo(supportStorageKey.fromPage, PAGES.PAGE_EXPORT_ACCOUNT);
      await setAccountInfo(supportStorageKey.exportType, exportType);
      navigate(PAGES.PAGE_SAVE_MNEMONIC);
    },
    [navigate],
  );

  return {
    hasMnemonic,
    goBack,
    gotoPage: useCheckLoginBeforeAction(gotoPage),
  };
};
