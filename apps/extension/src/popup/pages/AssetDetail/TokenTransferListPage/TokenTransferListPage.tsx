import { FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'antd';
import classNames from 'classnames';

import NavBar from '../../../../components/NavBar/NavBar';
import { RemindModal, useRemindModal } from '../../../../components/RemindModal';
import PreventTransferModal from '../../../../components/PreventTransferModal';
import TokenInfo from './components/TokenInfo';
import TransferList from './components/TransferList';
import CollectionList from './components/CollectionList';
import ButtonGroup from './components/ButtonGroup';
import DAppChainModal from './components/DAppChainModal';

import { useTokenTransferListBiz } from './hooks/transaction';
import { useCollectionTransferListBiz } from './hooks/collection';
import { TOKEN_TYPE_MAP_NAME } from '../../../../constants/common';

import styles from './TokenTransferListPage.m.scss';

const TokenTransferListPage = () => {
  const { formatMessage } = useIntl();
  const {
    state,
    tokenId,
    freezeUrl,
    pricesInfo,
    addressBook,
    selectedNode,
    selectedAddress,
    navigateToTokenDetail,
    navigateToTransferDetail,
    navigateToTransfer,
    setCurrentTab,
    getNextPageTransactions,
    setShowRiskTips,
    setShowSyncTips,
    setShowSyncModal,
    setShowPreventTransferModal,
    confirmSyncToken,
    setShowDAppChainModal,
  } = useTokenTransferListBiz();

  const {
    trxFrozenBalance,
    transactions,
    trxAvailableBalance,
    trxBalance,
    noFunctions,
    enableJustSwap,
    showRiskTips,
    showSyncTip,
    showSyncModal,
    showPreventTransferModal,
    showDAppChainModal,
    isLoadingTransaction,
    selectedTokenState: selectedToken,
  } = state;

  let { type, shortName, precision, transferStatus, tokenStatus } = selectedToken;

  if (type === 0) {
    precision = 6;
  }

  const {
    state: collectionState,
    setCollectionCurrentTab,
    navigateToCollectionDetail,
    getNextPageCollection,
    getNextPageCollectionTransaction,
  } = useCollectionTransferListBiz();
  const { collections, collectionTransactions, isLoadingCollection } = collectionState;

  const {
    isRemindModalVisible,
    checkAndShowRemindModal,
    onRemindModalCancel,
    onRemindModalConfirm,
  } = useRemindModal();

  const isCustomToken = tokenStatus === 1 || tokenStatus === 2;
  const typeName = isCustomToken
    ? formatMessage({ id: 'ASSET.MENU.SORT_BY_MANUAL' })
    : TOKEN_TYPE_MAP_NAME[type];

  return (
    <div className={styles.tokenTransferList}>
      <RemindModal
        isVisible={isRemindModalVisible}
        type={1}
        onConfirm={onRemindModalConfirm}
        onCancel={onRemindModalCancel}
      />
      <DAppChainModal
        isVisible={showDAppChainModal}
        setShowDAppChainModal={setShowDAppChainModal}
      />
      <NavBar
        title={
          <>
            <span className={styles.tokenName}>{shortName || ''}</span>
            {type !== 0 && (
              <span
                className={classNames(
                  styles.typeName,
                  isCustomToken
                    ? styles.custom
                    : type === 5
                    ? styles.trc721
                    : type === 2
                    ? styles.trc20
                    : styles.trc10,
                )}
              >
                {typeName}
              </span>
            )}
          </>
        }
        rightElement={
          type !== 0 && (
            <div
              className={styles.navDetail}
              onClick={() => {
                navigateToTokenDetail();
              }}
            >
              <FormattedMessage id="TRANSACTION.TOKEN_INFO.DETAILS" />
            </div>
          )
        }
      />

      <div className={styles.content}>
        <TokenInfo
          trxFrozenBalance={trxFrozenBalance}
          trxAvailableBalance={trxAvailableBalance}
          trxBalance={trxBalance}
          pricesInfo={pricesInfo}
          selectedToken={selectedToken}
          freezeUrl={freezeUrl}
          noFunctions={noFunctions}
          showRiskTips={showRiskTips}
          showSyncTip={showSyncTip}
          setShowRiskTips={setShowRiskTips}
          setShowSyncTips={setShowSyncTips}
          setShowSyncModal={setShowSyncModal}
        />

        {type !== 5 ? (
          <TransferList
            precision={precision}
            transactions={transactions}
            selectedAddress={selectedAddress}
            addressBook={addressBook}
            isLoadingTransaction={isLoadingTransaction}
            setCurrentTab={setCurrentTab}
            navigateToTransferDetail={navigateToTransferDetail}
            getNextPageTransactions={getNextPageTransactions}
          />
        ) : (
          <CollectionList
            selectedAddress={selectedAddress}
            collections={collections}
            collectionTransactions={collectionTransactions}
            isLoadingCollection={isLoadingCollection}
            setCollectionCurrentTab={setCollectionCurrentTab}
            navigateToCollectionDetail={navigateToCollectionDetail}
            navigateToTransferDetail={navigateToTransferDetail}
            getNextPageCollection={getNextPageCollection}
            getNextPageCollectionTransaction={getNextPageCollectionTransaction}
          />
        )}

        <ButtonGroup
          type={type}
          enableJustSwap={enableJustSwap}
          tokenId={tokenId}
          transferStatus={transferStatus}
          selectedNode={selectedNode}
          navigateToTransfer={navigateToTransfer}
          checkAndShowRemindModal={checkAndShowRemindModal}
          setShowDAppChainModal={setShowDAppChainModal}
        />
      </div>

      <PreventTransferModal
        showModal={showPreventTransferModal}
        setShowModal={setShowPreventTransferModal}
      />

      <div id="syncModalWrap" className={styles.syncModalWrap}>
        <Modal
          closable={false}
          visible={showSyncModal}
          title={formatMessage({ id: 'ASSET.CUSTOM.TIP.SYNC_TOKEN_CONFIRM' })}
          cancelText={formatMessage({ id: 'BUTTON.CANCEL' })}
          okText={formatMessage({ id: 'BUTTON.CONFIRM' })}
          onCancel={() => {
            setShowSyncModal(false);
          }}
          onOk={() => {
            confirmSyncToken();
          }}
          getContainer={() => {
            return document.querySelector('#syncModalWrap') || document.body;
          }}
        >
          <p>
            <FormattedMessage id="ASSET.CUSTOM.TIP.SYNC_TOKEN_HOVER" />
          </p>
        </Modal>
      </div>
    </div>
  );
};

export default TokenTransferListPage;
