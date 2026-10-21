import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';
import classNames from 'classnames';
import _ from 'lodash';

import PAGES from '../../../../constants/pages';
import { useAssetsManagementBiz } from './hook';

import NavBar from '../../../../components/NavBar/NavBar';
import SearchInput from './components/SearchInput';
import TabMenu from './components/TabMenu';
import NewAsset from './components/NewAsset';
import FollowedAsset from './components/FollowedAsset';
import UnFollowedAsset from './components/UnFollowedAsset';

import styles from './MyAssetsPage.m.scss';

const MyAssetsPage = () => {
  const {
    state,
    goBack,
    gotoTokensPage,
    changeTab,
    tronscanHost,
    onClickHideTokenAsZero,
    assetOperation,
    cancelDeleteToken,
    confirmDeleteToken,
    onFollowAsset,
    oneClickFollowAsset,
  } = useAssetsManagementBiz();

  const {
    tabIndex,
    hideTokenAsZero,
    followedAsset,
    followedCollection,
    deleteToken,
    unFollowedAsset,
    unFollowedCollection,
    newAsset,
    newCollection,
  } = state;

  const newAssetArr = tabIndex === 0 ? newAsset : newCollection;
  const followedAssetArr = tabIndex === 0 ? followedAsset : followedCollection;
  const unFollowedAssetArr = tabIndex === 0 ? unFollowedAsset : unFollowedCollection;
  const navigator = useNavigate();
  const navigateTargetPage = (targetPage: PAGES) => {
    navigator(targetPage);
  };
  return (
    <div className={classNames(styles.container, 'col')}>
      <NavBar
        onClickLeft={goBack}
        title="ASSET.ASSET_MANAGE"
        rightElement={
          <div
            className={styles.rightElement}
            onClick={() => navigateTargetPage(PAGES.PAGE_ASSETS_MANAGEMENT_CUSTOM)}
          >
            <FormattedMessage id="ASSET.CUSTOM.ENTRY_TITLE" />
          </div>
        }
      />

      <SearchInput onFocus={gotoTokensPage} />

      <TabMenu tabIndex={tabIndex} changeTab={changeTab} />
      <div className={classNames(styles.assetContent, 'col')}>
        {_.size(newAssetArr) > 0 && (
          <NewAsset
            asset={newAssetArr}
            tronscanHost={tronscanHost}
            onFollowAsset={onFollowAsset}
            oneClickFollowAsset={oneClickFollowAsset}
          />
        )}
        {_.size(newAssetArr) > 0 && <div className={styles.grayGap}></div>}
        {_.size(followedAssetArr) > 0 && (
          <FollowedAsset
            onClickHideTokenAsZero={onClickHideTokenAsZero}
            hideTokenAsZero={hideTokenAsZero}
            asset={followedAssetArr}
            tronscanHost={tronscanHost}
            assetOperation={assetOperation}
            deleteToken={deleteToken}
            cancelDeleteToken={cancelDeleteToken}
            confirmDeleteToken={confirmDeleteToken}
          />
        )}
        {_.size(unFollowedAssetArr) > 0 && <div className={styles.grayGap}></div>}
        {_.size(unFollowedAssetArr) > 0 && (
          <UnFollowedAsset
            asset={unFollowedAssetArr}
            tronscanHost={tronscanHost}
            onFollowAsset={onFollowAsset}
          />
        )}
      </div>
    </div>
  );
};

export default MyAssetsPage;
