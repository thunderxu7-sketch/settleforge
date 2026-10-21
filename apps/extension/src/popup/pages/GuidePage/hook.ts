import { useNavigate } from 'react-router';
import { useCallback, useEffect, useState } from 'react';

import { callLanguageService } from '../../../service/settings_service';
import { msgNode } from '../../inst';
import PAGES from '../../../constants/pages';
import { useSelectedLanguage } from '../../../hooks/language';
import { getAccountInfo, setAccountInfo } from '../../../hooks/account_info';
import { callOpenSecondaryPopupService } from '../../../service/open_secondary_popup_service';
import { useAppDispatch } from '../../../store/hooks';
import { supportStorageKey } from '../../../constants/wallet_type';
import { updateCheckLedgerImportLoading } from '../../../store/slices/notification';
import { IMPORT_GUIDE_PATH, useLedgerImportLoading } from '../../../hooks/ledger_import_loading';

export const useGuideBiz = () => {
  const { langAbbr: langCode } = useSelectedLanguage();
  const navigate = useNavigate();

  const [isAllowPrivacy, setAllowPrivacy] = useState(true);
  const [isPrivacyVisible, setPrivacyVisible] = useState(false);
  const [nextPage, setNextPage] = useState<string>('');

  const appDispatch = useAppDispatch();

  // avoid loading status persistent.
  useLedgerImportLoading();

  useEffect(() => {
    (async () => {
      //removeStorageItem(supportStorageKey.importWallet);
      await setAccountInfo(supportStorageKey.createWalletBackup, '');
      const allowPrivacy = await getAccountInfo(supportStorageKey.allowPrivacy);
      const isAllowPrivacy = allowPrivacy === 'true';
      setAllowPrivacy(isAllowPrivacy);
    })();
  }, []);

  const changeLang = useCallback(async (value: string): Promise<void> => {
    await callLanguageService(msgNode, { value });
  }, []);

  const pageJumpAction = useCallback(
    async (page: string) => {
      if (isAllowPrivacy) {
        await setAccountInfo(supportStorageKey.fromPage, PAGES.PAGE_GUIDE);
        if (page === 'create') {
          navigate(PAGES.PAGE_CREATE_WALLET);
        } else if (page === 'import') {
          navigate(PAGES.PAGE_IMPORT_WALLET, { state: { fromPage: PAGES.PAGE_GUIDE } });
        }
        return;
      }

      setNextPage(page);
      setPrivacyVisible(true);
    },
    [navigate, isAllowPrivacy],
  );

  const connectLedger = async () => {
    await setAccountInfo('ledgerGuideFrom', 'loadAccount');
    await setAccountInfo(supportStorageKey.fromPage, PAGES.PAGE_GUIDE);
    await callOpenSecondaryPopupService(msgNode, {
      path: IMPORT_GUIDE_PATH,
    });
    appDispatch(updateCheckLedgerImportLoading());
  };

  const agreePrivacy = useCallback(async () => {
    await setAccountInfo(supportStorageKey.allowPrivacy, String(true));
    await setAccountInfo(supportStorageKey.fromPage, PAGES.PAGE_GUIDE);
    setAllowPrivacy(true);
    setPrivacyVisible(false);
    if (nextPage) {
      if (nextPage === 'create') {
        navigate(PAGES.PAGE_CREATE_WALLET);
      } else if (nextPage === 'import') {
        navigate(PAGES.PAGE_IMPORT_WALLET, { state: { fromPage: PAGES.PAGE_GUIDE } });
      }
    } else {
      connectLedger();
    }
  }, [nextPage, connectLedger]);

  const closePrivacyContent = useCallback(() => {
    setPrivacyVisible(false);
  }, []);

  const openLedgerGuidePage = useCallback(() => {
    if (isAllowPrivacy) {
      connectLedger();
      return;
    }
    setNextPage('');
    setPrivacyVisible(true);
  }, [isAllowPrivacy]);

  return {
    langCode,
    isAllowPrivacy,
    isPrivacyVisible,
    changeLang,
    pageJumpAction,
    agreePrivacy,
    closePrivacyContent,
    openLedgerGuidePage,
  };
};
