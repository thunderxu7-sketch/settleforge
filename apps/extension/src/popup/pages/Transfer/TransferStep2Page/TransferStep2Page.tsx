import { FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'antd';

import NavBar from '../../../../components/NavBar/NavBar';
import Button from '../../../../components/Button';
import TokenInput from './components/TokenInput';
import TokenSelect from './components/TokenSelect';
import AmountInput from './components/AmountInput';
import CollectionInput from './components/CollectionInput';
import CollectionSelect from './components/CollectionSelect';
import RemarksTextArea from './components/RemarksTextArea';

import { useTransferStep2TokenBiz } from './hook/token';
import { useTransferStep2CollectionBiz } from './hook/collection';

import styles from './TransferStep2Page.m.scss';

const TransferStep2Page = () => {
  const { formatMessage } = useIntl();

  const {
    state: tokenState,
    pricesInfo,
    setShowTokenSelect,
    setSelectedToken,
    setTokenAmount,
    quicklyInputMaxAmount,
    setShowRemarks,
    setRemarks,
    setShowModal,
    setTokenSearchKey,
    setTokenFilterCondition,
    calFee,
    getAccountInfo,
  } = useTransferStep2TokenBiz();
  const {
    tokenStatus,
    tokenTips,
    selectedToken,
    showTokenSelect,

    allTokenList,

    tokenAmount,
    tokenValue,
    amountStatus,
    amountTips,

    remarks,
    showRemarks,

    showModal,

    tokenSearchKey,
    tokenFilterCondition,
  } = tokenState;

  const {
    state: collectionState,
    hasGetAllCollection,
    setShowCollectionSelect,
    setSelectedCollection,
    setSearchCollectionKeyWords,
    gotoConfirmPage,
    getNextPage,
  } = useTransferStep2CollectionBiz(tokenState, calFee, getAccountInfo);
  const { showCollectionSelect, selectedCollection, allCollections, searchCollectionKeyWords } =
    collectionState;

  const checkSendBtnAvaliable = () => {
    const { type } = selectedToken;
    if (tokenStatus === 'error') {
      return false;
    }

    if (type !== 5) {
      if (amountStatus === 'error' || !tokenAmount) {
        return false;
      }
    } else {
      if (allCollections.length === 0 || !selectedCollection) {
        return false;
      }
    }

    return true;
  };

  const isValid = checkSendBtnAvaliable();

  return (
    <div className={styles.transferStep2}>
      <NavBar
        title={
          <div className={styles.title}>
            <FormattedMessage id="ACCOUNT.TYPE.SEND" />
            <span>(2/2)</span>
          </div>
        }
      />
      <div className={styles.content} id="content">
        {showModal && (
          <Modal
            visible={showModal}
            closable={false}
            title={formatMessage({ id: 'ACCOUNT.SEND.CONFIRM_CLEAN' })}
            onCancel={() => {
              setShowModal(false);
            }}
            onOk={() => {
              setRemarks('');
              setShowModal(false);
            }}
            cancelText={formatMessage({ id: 'BUTTON.CANCEL' })}
            okText={formatMessage({ id: 'BUTTON.CONFIRM2' })}
            getContainer={() => {
              return document.querySelector('#content') ?? document.body;
            }}
          />
        )}

        <div>
          <TokenInput
            tokenStatus={tokenStatus}
            tokenTips={tokenTips}
            selectedToken={selectedToken}
            setShowTokenSelect={setShowTokenSelect}
          />

          {selectedToken?.type == 5 ? (
            <CollectionInput
              selectedToken={selectedToken}
              selectedCollection={selectedCollection}
              setShowCollectionSelect={setShowCollectionSelect}
            />
          ) : (
            <AmountInput
              tokenAmount={tokenAmount}
              tokenValue={tokenValue}
              amountStatus={amountStatus}
              amountTips={amountTips}
              symbol={pricesInfo.symbol}
              selectedToken={selectedToken}
              setTokenAmount={setTokenAmount}
              quicklyInputMaxAmount={quicklyInputMaxAmount}
            />
          )}

          {showRemarks ? (
            <RemarksTextArea
              remarks={remarks}
              setShowRemarks={setShowRemarks}
              setRemarks={setRemarks}
              setShowModal={setShowModal}
            />
          ) : (
            <div
              className={styles.addRemarksBtn}
              onClick={() => {
                setShowRemarks(true);
              }}
            >
              <FormattedMessage id="ACCOUNT.SEND.ADD_REMARKS" />
              <i></i>
            </div>
          )}

          {showTokenSelect && (
            <TokenSelect
              showTokenSelect={showTokenSelect}
              allTokenList={allTokenList}
              selectedToken={selectedToken}
              tokenSearchKey={tokenSearchKey}
              tokenFilterCondition={tokenFilterCondition}
              prices={pricesInfo}
              setShowTokenSelect={setShowTokenSelect}
              setSelectedToken={setSelectedToken}
              setTokenSearchKey={setTokenSearchKey}
              setTokenFilterCondition={setTokenFilterCondition}
            />
          )}

          {showCollectionSelect && (
            <CollectionSelect
              showCollectionSelect={showCollectionSelect}
              selectedCollection={selectedCollection}
              allCollections={allCollections}
              searchCollectionKeyWords={searchCollectionKeyWords}
              hasGetAllCollection={hasGetAllCollection}
              setShowCollectionSelect={setShowCollectionSelect}
              setSelectedCollection={setSelectedCollection}
              setSearchCollectionKeyWords={setSearchCollectionKeyWords}
              getNextPage={getNextPage}
            />
          )}
        </div>
        <Button
          id="ACCOUNT.TYPE.SEND"
          isValid={isValid}
          onClick={() => {
            gotoConfirmPage();
          }}
          tabIndex={1}
        />
      </div>
    </div>
  );
};

export default TransferStep2Page;
