import { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { useAppSelector } from '../store/hooks';
import { selectCheckLedgerImportLoading } from '../store/slices/notification';
import { callGetSecondaryPopupUrlService } from '../service/get_secondary_popup_url_service';
import Toast from '../components/Toast';
import { msgNode } from '../popup/inst';
import PAGES from '../constants/pages';

export const IMPORT_GUIDE_PATH = `secondary_popup/secondary_popup.html#${PAGES.PAGE_LEDGER_IMPORT_GUIDE}`;

export const useLedgerImportLoading = () => {
  const { formatMessage } = useIntl();
  const checkLedgerImportLoading = useAppSelector(selectCheckLedgerImportLoading);
  useEffect(() => {
    (async () => {
      const { url } = await callGetSecondaryPopupUrlService(msgNode);

      if (url.includes(IMPORT_GUIDE_PATH)) {
        Toast.show({
          icon: 'loading',
          duration: 0,
          content: formatMessage({
            id: 'WALLET.LEDGER.CONNECT.LOADING',
          }),
        });
      } else {
        Toast.hide();
      }
    })();
  }, [checkLedgerImportLoading]);
};
