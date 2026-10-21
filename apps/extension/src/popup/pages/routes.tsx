import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import PAGES from '../../constants/pages';

import { useRestoreLatestLocation } from '../../hooks/location';
import { RequireAuthRoute } from '../../components/RequireAuth';

import LoginPage from './LoginPage';
import HomePage from './HomePage';
import TokenTransferListPage from './AssetDetail/TokenTransferListPage';
import ReceivePage from './ReceivePage';
import SettingsPage from './SettingsPage';
import TransferStep1Page from './Transfer/TransferStep1Page';
import TransferStep2Page from './Transfer/TransferStep2Page';
import TransferStep3Page from './Transfer/TransferStep3Page';
import BroadcastPage from './BroadcastPage';
import SignPage from '../../secondary_popup/pages/SignPage';
import { CustomPage, MyAssetsPage, TokensPage } from './AssetManagement';
import TransferDetailPage from './TransferDetailPage';
import ConnectWebsitePage from '../../secondary_popup/pages/ConnectWebsitePage';
import WatchAsset from '../../secondary_popup/pages/WatchAsset';

import Loading from '../../components/Loading';

import { useAuth } from '../../hooks/auth';
import { AuthProvider } from '../../context/auth_context';
import { msgNode } from '../inst';
import { useAppSelector } from '../../store/hooks';
import { selectAddressInfo } from '../../store/slices/address_info';
import _ from 'lodash';
import { WindowType } from '../../constants/types';

const ImportWalletPage = lazy(() => import('./ImportWalletPage'));
const ImportConfirmPage = lazy(() => import('./ImportConfirmPage'));
const AddWalletPage = lazy(() => import('./AddWalletPage'));
const GuidePage = lazy(() => import('./GuidePage'));
const CreateWalletPage = lazy(() => import('./CreateWalletPage'));
const ImportAddressPage = lazy(() => import('./ImportAddressPage'));
const ImportPathPage = lazy(() => import('./ImportPathPage'));
const LedgerConfirmPage = lazy(() => import('./LedgerConfirmPage'));
const LedgerAddressPage = lazy(() => import('./LedgerAddressPage'));
const LedgerPathPage = lazy(() => import('./LedgerPathPage'));
const CustomSortPage = lazy(() => import('./CustomSortPage'));
const TokenDetailPage = lazy(() => import('./AssetDetail/TokenDetailPage'));
const CollectionDetailPage = lazy(() => import('./AssetDetail/CollectionDetailPage'));
const NodeManagementPage = lazy(() => import('./NodeManagementPage'));
const DAppListPage = lazy(() => import('./DAppListPage'));
const AddressBookPage = lazy(() => import('./AddressBook/AddressBookPage'));
const AddressBookDetailPage = lazy(() => import('./AddressBook/AddressBookDetailPage'));
const AboutPage = lazy(() => import('./AboutPage'));
const SaveMnemonicPage = lazy(() => import('./SaveMnemonicPage'));
const CheckMnemonicPage = lazy(() => import('./CheckMnemonicPage'));
const NewHDAddressPage = lazy(() => import('./NewHDAddressPage'));
const SwitchSeedPage = lazy(() => import('./SwitchSeedPage'));
const ManualPathPage = lazy(() => import('./ManualPathPage'));
const ExportAccountPage = lazy(() => import('./ExportAccountPage'));

const AppRoutes = () => {
  const { isAuthed } = useAuth(msgNode);
  const addressInfo = useAppSelector(selectAddressInfo);
  const hasAddress = _.size(addressInfo.addressItems) > 0;
  const isRestoreDone = useRestoreLatestLocation();

  if (!isRestoreDone || isAuthed == undefined) {
    return null;
  }

  return (
    <AuthProvider authContextObj={{ isAuthed, hasAddress }}>
      <Routes>
        <Route path={PAGES.PAGE_LOGIN} element={<LoginPage />} />

        <Route
          path={PAGES.PAGE_IMPORT_WALLET}
          element={
            <Suspense fallback={<Loading />}>
              <ImportWalletPage />
            </Suspense>
          }
        />
        <Route
          path={PAGES.PAGE_IMPORT_CONFIRM}
          element={
            <Suspense fallback={<Loading />}>
              <ImportConfirmPage />
            </Suspense>
          }
        />
        <Route
          path={PAGES.PAGE_GUIDE}
          element={
            <Suspense fallback={<Loading />}>
              <GuidePage />
            </Suspense>
          }
        />
        <Route
          path={PAGES.PAGE_CREATE_WALLET}
          element={
            <Suspense fallback={<Loading />}>
              <CreateWalletPage />
            </Suspense>
          }
        />
        <Route
          path={PAGES.PAGE_IMPORT_ADDRESS}
          element={
            <Suspense fallback={<Loading />}>
              <ImportAddressPage />
            </Suspense>
          }
        />
        <Route
          path={PAGES.PAGE_IMPORT_PATH}
          element={
            <Suspense fallback={<Loading />}>
              <ImportPathPage />
            </Suspense>
          }
        />
        <Route
          path={PAGES.PAGE_LEDGER_CONFIRM}
          element={
            <Suspense fallback={<Loading />}>
              <LedgerConfirmPage />
            </Suspense>
          }
        />
        <Route
          path={PAGES.PAGE_LEDGER_ADDRESS}
          element={
            <Suspense fallback={<Loading />}>
              <LedgerAddressPage />
            </Suspense>
          }
        />
        <Route
          path={PAGES.PAGE_LEDGER_PATH}
          element={
            <Suspense fallback={<Loading />}>
              <LedgerPathPage />
            </Suspense>
          }
        />
        <Route path="/" element={<RequireAuthRoute isAuthed={isAuthed} hasAddress={hasAddress} />}>
          <Route path={PAGES.PAGE_HOMEPAGE} element={<HomePage />} />
          <Route
            path={PAGES.PAGE_ADD_WALLET}
            element={
              <Suspense fallback={<Loading />}>
                <AddWalletPage />
              </Suspense>
            }
          />
          <Route
            path={PAGES.PAGE_CUSTOM_SORT}
            element={
              <Suspense fallback={<Loading />}>
                <CustomSortPage />
              </Suspense>
            }
          />

          <Route path={PAGES.PAGE_ASSETS_MANAGEMENT}>
            <Route path="my_assets" element={<MyAssetsPage />} />
            <Route path="tokens" element={<TokensPage />} />
            <Route path="custom" element={<CustomPage />} />
          </Route>

          <Route path={PAGES.PAGE_ASSET_DETAIL}>
            <Route
              path="token_detail"
              element={
                <Suspense fallback={<Loading />}>
                  <TokenDetailPage />
                </Suspense>
              }
            />
            <Route path="token_transfer_list" element={<TokenTransferListPage />} />
            <Route
              path="collection_detail"
              element={
                <Suspense fallback={<Loading />}>
                  <CollectionDetailPage />
                </Suspense>
              }
            />
          </Route>

          <Route path={PAGES.PAGE_SETTINGS} element={<SettingsPage />} />
          <Route
            path={PAGES.PAGE_NODE_MANAGEMENT}
            element={
              <Suspense fallback={<Loading />}>
                <NodeManagementPage />
              </Suspense>
            }
          />
          <Route
            path={PAGES.PAGE_DAPPLIST}
            element={
              <Suspense fallback={<Loading />}>
                <DAppListPage />
              </Suspense>
            }
          />

          <Route path={PAGES.PAGE_RECEIVE} element={<ReceivePage />} />

          <Route path={PAGES.PAGE_ADDRESS_BOOK}>
            <Route
              path="list"
              element={
                <Suspense fallback={<Loading />}>
                  <AddressBookPage />
                </Suspense>
              }
            />
            <Route
              path="detail"
              element={
                <Suspense fallback={<Loading />}>
                  <AddressBookDetailPage />
                </Suspense>
              }
            />
          </Route>

          <Route
            path={PAGES.PAGE_ABOUT}
            element={
              <Suspense fallback={<Loading />}>
                <AboutPage />
              </Suspense>
            }
          />
          <Route
            path={PAGES.PAGE_SAVE_MNEMONIC}
            element={
              <Suspense fallback={<Loading />}>
                <SaveMnemonicPage />
              </Suspense>
            }
          />
          <Route
            path={PAGES.PAGE_CHECK_MNEMONIC}
            element={
              <Suspense fallback={<Loading />}>
                <CheckMnemonicPage />
              </Suspense>
            }
          />
          <Route
            path={PAGES.PAGE_NEW_HD_ADDRESS}
            element={
              <Suspense fallback={<Loading />}>
                <NewHDAddressPage />
              </Suspense>
            }
          />
          <Route
            path={PAGES.PAGE_SWITCH_SEED}
            element={
              <Suspense fallback={<Loading />}>
                <SwitchSeedPage />
              </Suspense>
            }
          />
          <Route
            path={PAGES.PAGE_MANUAL_PATH}
            element={
              <Suspense fallback={<Loading />}>
                <ManualPathPage />
              </Suspense>
            }
          />
          <Route
            path={PAGES.PAGE_EXPORT_ACCOUNT}
            element={
              <Suspense fallback={<Loading />}>
                <ExportAccountPage />
              </Suspense>
            }
          />

          <Route path={PAGES.PAGE_TRANSFER_STEP_1} element={<TransferStep1Page />} />
          <Route path={PAGES.PAGE_TRANSFER_STEP_2} element={<TransferStep2Page />} />
          <Route path={PAGES.PAGE_TRANSFER_STEP_3} element={<TransferStep3Page />} />

          <Route path={PAGES.PAGE_CONNECT_WEBSITE} element={<ConnectWebsitePage />} />
          <Route path={PAGES.PAGE_SIGN} element={<SignPage windowType={WindowType.POPUP} />} />
          <Route
            path={PAGES.PAGE_WATCH_ASSET}
            element={<WatchAsset windowType={WindowType.POPUP} />}
          />

          <Route path={PAGES.PAGE_BROADCAST} element={<BroadcastPage />} />

          <Route path={PAGES.PAGE_TRANSFER_DETAIL} element={<TransferDetailPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;
