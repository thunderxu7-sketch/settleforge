import classNames from 'classnames';

import InfoCard from './component/InfoCard';
import BannerMenu from './component/BannerMenu';
import AssetList from './component/AssetList';
import WalletList from './component/WalletList';
import Filter from './component/Filter';
import { ConnectedAddresses, ConnectedWebsites } from './component/Connected';
import NameModal from './component/NameModal';
import DeleteAddress from './component/DeleteAddress';
import MultiSignNotice from './component/MultiSignNotice';
import MultiSignJump from './component/MultiSignJump';
import BackupNotice from './component/BackupNotice';
import { RemindModal, useRemindModal } from '../../../components/RemindModal';
import VersionUpdateModal from '../../../components/VersionUpdateModal';

import { useHomePageBiz } from './hook';
import { useSaveLatestLocation } from '../../../hooks/location';

import styles from './HomePage.m.scss';

const HomePage = () => {
  useSaveLatestLocation();
  const {
    state,
    selectedCurrency,
    setFilterVisible,
    nodeIds,
    nodeList,
    selectedNode,
    onClickNode,
    setWalletListVisible,
    setWalletSearchVisible,
    selectedAddressItem,
    changeTab,
    tokenSearchOnChange,
    clearInputValue,
    setFilterOptions,
    toggleConnectedWebsites,
    toggleConnectedAddresses,
    onClickWalletCard,
    onChangeWalletSearch,
    toggleNameModalVisible,
    toggleDeleteAddressVisible,
    updateDeleteAddress,
    backupMnemonic,
    setMenuListVisible,
    setSelectVisible,
    multiSignCount,
    closeMultiSignNotice,
    closeMultiSignJump,
    updateFilterImage,
    checkSelectStatus,
    balanceVisible,
    toggleBalanceVisible,
    refreshHomePage,
    toggleSearchBar,
  } = useHomePageBiz();

  const {
    filterVisible,
    walletListVisible,
    walletSearchVisible,
    homeAsset,
    homeCollection,

    tabIndex,
    clearVisible,
    tokenSearchValue,
    fieldFound,
    tokenDomList,
    tokenDataList,

    filterOptions,
    walletInfo,
    walletSearchResult,
    walletSearchValue,
    addressResource,
    menuListVisible,
    selectVisible,
    isMultiSignNoticeVisible,
    isMultiSignJumpVisible,
    nameModalVisible,
    deleteAddressVisible,
    remindStatus,
    isSearchBarVisible,
    filterImage,
  } = state;

  const {
    remindModalType,
    isRemindModalVisible,
    checkAndShowRemindModal,
    onRemindModalCancel,
    onRemindModalConfirm,
  } = useRemindModal(onClickWalletCard);

  return (
    <div className={styles.pageContainer} onClick={checkSelectStatus}>
      <RemindModal
        isVisible={isRemindModalVisible}
        type={remindModalType}
        onConfirm={onRemindModalConfirm}
        onCancel={onRemindModalCancel}
      />
      <VersionUpdateModal />
      <MultiSignJump
        isVisible={isMultiSignJumpVisible}
        onClose={closeMultiSignJump}
        jumpUrl={
          // @ts-ignore
          nodeList[selectedNode].multiSignUrl
        }
      />
      <ConnectedWebsites
        name={selectedAddressItem?.name}
        isVisible={state.isConnectedWebsitesVisible}
        onClose={toggleConnectedWebsites}
      />
      <ConnectedAddresses
        isVisible={state.isConnectedAddressesVisible}
        onClose={toggleConnectedAddresses}
      />
      <NameModal
        visible={nameModalVisible}
        toggleVisible={toggleNameModalVisible}
        selectedAccount={walletInfo?.selectedAccounts[0]}
      />
      <DeleteAddress
        visible={deleteAddressVisible}
        toggleVisible={toggleDeleteAddressVisible}
        updateDeleteAddress={updateDeleteAddress}
        selectedAddress={walletInfo?.selectedAccounts[0]?.address}
      />
      <div className={classNames(styles.frontPage, styles.relative)}>
        <InfoCard
          nodeIds={nodeIds}
          nodeList={nodeList}
          selectedNode={selectedNode}
          onClickNode={onClickNode}
          setWalletListVisible={setWalletListVisible}
          selectedAccount={walletInfo?.selectedAccounts[0]}
          addressResource={addressResource}
          showConnectedWebsites={toggleConnectedWebsites}
          showConnectedAddresses={toggleConnectedAddresses}
          showNameModal={toggleNameModalVisible}
          showDeleteAddress={toggleDeleteAddressVisible}
          menuListVisible={menuListVisible}
          setMenuListVisible={setMenuListVisible}
          selectVisible={selectVisible}
          setSelectVisible={setSelectVisible}
          balanceVisible={balanceVisible}
          toggleBalanceVisible={toggleBalanceVisible}
          refreshHomePage={refreshHomePage}
          checkAndShowRemindModal={checkAndShowRemindModal}
        />
        <BannerMenu checkAndShowRemindModal={checkAndShowRemindModal} />
        <AssetList
          setFilterVisible={setFilterVisible}
          homeAsset={homeAsset}
          homeCollection={homeCollection}
          tabIndex={tabIndex}
          clearVisible={clearVisible}
          tokenSearchValue={tokenSearchValue}
          fieldFound={fieldFound}
          tokenDomList={tokenDomList}
          tokenDataList={tokenDataList}
          tokenSearchOnChange={tokenSearchOnChange}
          changeTab={changeTab}
          clearInputValue={clearInputValue}
          balanceVisible={balanceVisible}
          isSearchBarVisible={isSearchBarVisible}
          onToggleSearchBar={toggleSearchBar}
          filterImage={filterImage}
          filterOptions={filterOptions}
        />
        <WalletList
          walletInfo={walletInfo}
          walletListVisible={walletListVisible}
          setWalletListVisible={setWalletListVisible}
          walletSearchVisible={walletSearchVisible}
          setWalletSearchVisible={setWalletSearchVisible}
          selectedCurrency={selectedCurrency}
          onClickWalletCard={onClickWalletCard}
          onChangeWalletSearch={onChangeWalletSearch}
          walletSearchResult={walletSearchResult}
          walletSearchValue={walletSearchValue}
          checkAndShowRemindModal={checkAndShowRemindModal}
        />
      </div>
      {filterVisible && (
        <Filter
          setFilterVisible={setFilterVisible}
          filterOptions={filterOptions}
          setFilterOptions={setFilterOptions}
          updateFilterImage={updateFilterImage}
          filterImage={filterImage}
        />
      )}

      <MultiSignNotice
        isVisible={isMultiSignNoticeVisible}
        multiSignCount={multiSignCount}
        onClose={closeMultiSignNotice}
      />
      <BackupNotice
        isVisible={!isMultiSignNoticeVisible && remindStatus}
        onBackup={backupMnemonic}
      />
    </div>
  );
};

export default HomePage;
