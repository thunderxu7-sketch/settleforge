import { Route, Routes } from 'react-router-dom';

import { useSecondaryPopupRedirect } from '../../hooks/location';

import PAGES from '../../constants/pages';
import LedgerImportGuidePage from './Ledger/LedgerImportGuidePage';
import ConnectWebsitePage from './ConnectWebsitePage';
import SignPage from './SignPage';
import WatchAsset from './WatchAsset';
import { WindowType } from '../../constants/types';

const AppRoutes = () => {
  useSecondaryPopupRedirect();
  const windowType = WindowType.SECONDARY;

  return (
    <Routes>
      <Route path={PAGES.PAGE_LEDGER_IMPORT_GUIDE} element={<LedgerImportGuidePage />} />
      <Route path={PAGES.PAGE_CONNECT_WEBSITE} element={<ConnectWebsitePage />} />
      <Route path={PAGES.PAGE_SIGN} element={<SignPage windowType={windowType} />} />
      <Route path={PAGES.PAGE_WATCH_ASSET} element={<WatchAsset windowType={windowType} />} />
    </Routes>
  );
};

export default AppRoutes;
