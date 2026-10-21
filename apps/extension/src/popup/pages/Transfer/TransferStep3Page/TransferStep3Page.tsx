import { FormattedMessage, useIntl } from 'react-intl';

import { BigNumber, bigFormat } from '../../../utils/numberUtils';
import NavBar from '../../../../components/NavBar/NavBar';
import Button from '../../../../components/Button';
import LedgerModal from '../../../../components/LedgerModal';
import PrepareConnectLedgerModal from '../../../../components/PrepareConnectLedgerModal';
import CostDetailInfo from './components/CostDetailInfo';
import RemarksDetailInfo from './components/RemarksDetailInfo';
import TokenDetail from './components/TokenDetail';
import AddressDetail from './components/AddressDetail';
import CostDetail from './components/CostDetail';
import CollectionDetail from './components/CollectionDetail';

import { useTransferStep3Biz } from './hooks/confirmation';
import { isCustomToken } from '../utils/token';
import { NODE_FORMAT_ID } from '../../../../constants/tron_nodes';
import { useLedgerImportLoading } from '../../../../hooks/ledger_import_loading';

import styles from './TransferStep3Page.m.scss';

import TokenCustomDefaultImg from './images/token_custom_default.svg';
import Token10DefaultImage from './images/token_10_default.svg';
import Token721DefaultImage from './images/token_721_default.svg';

const TransferStep3Page = () => {
  const { formatMessage } = useIntl();

  useLedgerImportLoading();

  const {
    hostname,
    selectedNode,
    locationState,
    state,
    setShowCostDetail,
    setShowRemarksDetail,
    closeLedgerLoadingModal,
    onSend,
    onCancel,
    setShowPrepareConnectLedger,
    connectHidLedger,
    onBackCustomExtraHandle,
  } = useTransferStep3Biz();
  const {
    showCostDetail,
    showRemarksDetail,
    showTransferLoading,
    showPrepareConnectLedger,
    isRiskToken,
    trxEnough,
    useTrx,
    createAccountUseTrx,
    contractUseTrx,
    costBandwidth,
    costEnergy,
    showLedgerLoading,
    ledgerTips,
  } = state;
  const {
    selectedToken,
    fromAddressInfo,
    toAddressInfo,
    transferAmount,
    remarks,
    selectedCollection,
  } = (locationState as any) ?? {};
  const { tokenStatus, logoUrl, isOfficial, shortName, contractAddress, type, id, precision } =
    selectedToken ?? {};

  const {
    assetId,
    imageUrl,
    logoUrl: collectionLogoUrl,
    name: collectionName,
  } = selectedCollection ?? {};
  const { name: fromName = '', address: fromAddress = '' } = fromAddressInfo ?? {};
  const { name: toName = '', address: toAddress = '' } = toAddressInfo ?? {};

  const {
    net: netTypeText = 'CONFIRMATIONS.NEW.NETWORK.MAIN_NET',
    chain: chainTypeText = 'CONFIRMATIONS.NEW.NETWORK.MAINCHAIN',
  } = (NODE_FORMAT_ID as any)[selectedNode] ?? {};

  const tokenImg = isCustomToken(tokenStatus)
    ? TokenCustomDefaultImg
    : logoUrl || Token10DefaultImage;

  const collectionImg = collectionLogoUrl || imageUrl || Token721DefaultImage;

  return (
    <div className={styles.transferStep3}>
      <NavBar title="CONFIRMATIONS.SEND.HEADER" onBackCustomExtraHandle={onBackCustomExtraHandle} />

      <div className={styles.content}>
        <div>
          <p className={styles.chain}>
            <span>{fromName}</span>
            <span>
              {formatMessage({ id: netTypeText })} / {formatMessage({ id: chainTypeText })}
            </span>
          </p>

          {type !== 5 ? (
            <TokenDetail
              tokenImg={tokenImg}
              isOfficial={isOfficial}
              transferAmount={transferAmount}
              shortName={shortName}
              isRiskToken={isRiskToken}
              precision={precision}
            />
          ) : (
            <CollectionDetail
              tokenImg={tokenImg}
              shortName={shortName}
              collectionImg={collectionImg}
              assetId={assetId}
              collectionName={collectionName}
            />
          )}

          <AddressDetail
            fromAddress={fromAddress}
            fromName={fromName}
            toAddress={toAddress}
            toName={toName}
            type={type}
            id={id}
            contractAddress={contractAddress}
            hostname={hostname}
            shortName={shortName}
          />

          {new BigNumber(useTrx).gt(0) && (
            <CostDetail
              useTrx={useTrx}
              trxEnough={trxEnough}
              setShowCostDetail={setShowCostDetail}
            />
          )}

          <section className={styles.resourceDetail}>
            <p className={styles.title}>
              <FormattedMessage id="CONFIRMATIONS.SEND.RESOURCE" />
              <FormattedMessage id="CONFIRMATIONS.TITLE.PRE_CALCULATION" />
            </p>
            <p className={styles.resourceAmount}>
              <span>{bigFormat(costBandwidth)}&nbsp;</span>
              <FormattedMessage id="CONFIRMATIONS.RESOURCE.BANDWIDTH" />
              {new BigNumber(costEnergy).gt(0) && (
                <>
                  &nbsp;+&nbsp;
                  <span>{bigFormat(costEnergy)}&nbsp;</span>
                  <FormattedMessage id="CONFIRMATIONS.RESOURCE.ENERGY" />
                </>
              )}
            </p>
          </section>

          {remarks && (
            <section
              className={styles.remarksDetail}
              onClick={() => {
                setShowRemarksDetail(true);
              }}
            >
              <p className={styles.title}>
                <FormattedMessage id="CONFIRMATIONS.SEND.NOTE" />
                {/* <FormattedMessage id="CONFIRMATIONS.SEND.CHAIN" /> */}
              </p>
              <p className={styles.remarksText}>{remarks}</p>
            </section>
          )}
        </div>
        {showCostDetail && (
          <CostDetailInfo
            useTrx={useTrx}
            createAccountUseTrx={createAccountUseTrx}
            contractUseTrx={contractUseTrx}
            showCostDetail={showCostDetail}
            setShowCostDetail={setShowCostDetail}
          />
        )}
        {showRemarksDetail && (
          <RemarksDetailInfo
            remarks={remarks}
            showRemarksDetail={showRemarksDetail}
            setShowRemarksDetail={setShowRemarksDetail}
          />
        )}
        <div className={styles.btnGroup}>
          <Button id="BUTTON.REJECT" onClick={() => onCancel()} />
          <Button
            id="CONFIRMATIONS.AUTH.CONFIRM"
            isLoading={showTransferLoading}
            onClick={() => onSend()}
          />
        </div>
      </div>
      {showLedgerLoading && (
        <LedgerModal
          ledgerTips={ledgerTips}
          showLedgerLoading={showLedgerLoading}
          closeLedgerLoadingModal={closeLedgerLoadingModal}
        />
      )}

      {showPrepareConnectLedger && (
        <PrepareConnectLedgerModal
          showPrepareConnectLedger={showPrepareConnectLedger}
          onConfirm={() => {
            connectHidLedger().then();
            setShowPrepareConnectLedger(false);
          }}
          onClose={() => {
            setShowPrepareConnectLedger(false);
          }}
        />
      )}
    </div>
  );
};

export default TransferStep3Page;
