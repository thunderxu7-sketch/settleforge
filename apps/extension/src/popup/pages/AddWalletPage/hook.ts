import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectLedgerConnection } from '../../../store/slices/settings';
import PAGES from '../../../constants/pages';
import { callOpenSecondaryPopupService } from '../../../service/open_secondary_popup_service';
import { callGetMnemonicCountService } from '../../../service/get_mnemonic_count_service';
import { msgNode } from '../../inst';
import { useNavigate } from 'react-router';
import { clearImportWalletInfo } from '../../../service/importWalletInfo';
import { setAccountInfo } from '../../../hooks/account_info';
import { supportStorageKey } from '../../../constants/wallet_type';
import { LEDGER_WEB_HID } from '../SettingsPage/constants';
import { updateCheckLedgerImportLoading } from '../../../store/slices/notification';
import { IMPORT_GUIDE_PATH, useLedgerImportLoading } from '../../../hooks/ledger_import_loading';
import { useSaveLatestLocation } from '../../../hooks/location';
import { setShowWalletList } from '../../common/walletList';

export type ActionType = 'NEW_ADDRESS' | 'CREATE_WALLET' | 'IMPORT_WALLET' | 'LEDGER';

export interface Row {
  title: string;
  desc: string;
  icon: JSX.Element;
  actionType: ActionType;
}

export const useAddWalletBiz = (defaultRows: Row[]) => {
  const appDispatch = useAppDispatch();
  const navigate = useNavigate();
  useSaveLatestLocation();

  const [rows, setRows] = useState<Row[]>([]);
  const ledgerConnection = useAppSelector(selectLedgerConnection);

  useLedgerImportLoading();

  // initialize
  useEffect(() => {
    (async () => {
      let hasHDAccount = false;
      const { mnemonicAccountCount } = await callGetMnemonicCountService(msgNode, {});

      if (mnemonicAccountCount > 0) {
        hasHDAccount = true;
      }
      let rows;
      if (hasHDAccount) {
        rows = defaultRows.filter((ele, index) => index !== 1);
      } else {
        rows = defaultRows.filter((ele, index) => index !== 0);
      }
      setRows(rows);

      clearImportWalletInfo();
      await setAccountInfo(supportStorageKey.fromPage, '');
      await setAccountInfo(supportStorageKey.createWalletBackup, '');
    })();
  }, []);

  const gotoPage = useCallback(async (row: Row) => {
    await setAccountInfo(supportStorageKey.fromPage, PAGES.PAGE_ADD_WALLET);
    if (row.actionType === 'IMPORT_WALLET') {
      navigate(PAGES.PAGE_IMPORT_WALLET);
    } else if (row.actionType === 'CREATE_WALLET') {
      navigate(PAGES.PAGE_CREATE_WALLET);
    } else if (row.actionType === 'NEW_ADDRESS') {
      navigate(PAGES.PAGE_NEW_HD_ADDRESS);
    } else if (row.actionType === 'LEDGER') {
      await setAccountInfo('ledgerGuideFrom', 'loadAccount');

      if (ledgerConnection === LEDGER_WEB_HID) {
        await callOpenSecondaryPopupService(msgNode, {
          path: IMPORT_GUIDE_PATH,
        });
        appDispatch(updateCheckLedgerImportLoading());
      } else {
        navigate(PAGES.PAGE_LEDGER_CONFIRM);
      }
    }
  }, []);

  const goBack = useCallback(() => {
    setShowWalletList(true);
    navigate(PAGES.PAGE_HOMEPAGE);
  }, [navigate]);

  return {
    rows,
    gotoPage,
    goBack,
  };
};
