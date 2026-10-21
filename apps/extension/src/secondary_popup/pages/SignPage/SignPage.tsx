import _ from 'lodash';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { SignPageProps, useSignBiz } from './hooks';

import SignHeader from './components/SignHeader';
import SignNetwork from './components/SignNetwork';
import SignString from './components/SignString';
import SignTransaction from './components/SignTransaction';
import PrepareConnectLedgerModal from '../../../components/PrepareConnectLedgerModal';
import ApproveAddressModal from '../../../components/ApproveAddressModal';
import LedgerModal from '../../../components/LedgerModal';
import Confirmation from '../../../components/Confirmation';
import { useLedgerImportLoading } from '../../../hooks/ledger_import_loading';

import { CONFIRMATION_TYPE } from './constants';

import styles from './static/scss/common.m.scss';

const SignPage = ({ windowType }: SignPageProps) => {
  useLedgerImportLoading();

  const [rejectConfirm, setRejectConfirm] = useState(false);
  const {
    state,
    currentConfirmation,
    selectPrevious,
    selectNext,
    selectedAddressItem,
    selectedNode,
    changeTab,
    confirmSign,
    rejectSign,
    setShowLedgerLoading,
    setShowPrepareConnectLedger,
    rejectAllSign,
    onConfirmOpenLedgerGuide,
    setShowApproveAddressModal,
  } = useSignBiz({ windowType });
  const {
    selectedIndex,
    confirmations,
    tabIndex,
    showLedgerLoading,
    showPrepareConnectLedger,
    showApproveAddressModal,
    paramsInfo,
    costs,
    ledgerTips,
  } = state;

  if (
    !currentConfirmation ||
    (paramsInfo === null && currentConfirmation.type === CONFIRMATION_TYPE.TRANSACTION)
  ) {
    return <div></div>;
  }

  const hostname = encodeURIComponent(currentConfirmation?.hostname);
  const multiConfirmation = confirmations.length > 1;
  return (
    <div className={classNames(styles.signContainer)}>
      <SignHeader
        selectedIndex={selectedIndex}
        selectPrevious={selectPrevious}
        hostname={hostname}
        confirmations={confirmations}
        selectNext={selectNext}
      ></SignHeader>
      <SignNetwork
        selectedAddressItem={selectedAddressItem}
        selectedNode={selectedNode}
      ></SignNetwork>
      <div
        className={classNames(
          styles.signContentContainer,
          { [styles.signContentHeight]: multiConfirmation },
          'col',
          'scroll',
        )}
      >
        {currentConfirmation.type === CONFIRMATION_TYPE.STRING ? (
          <SignString
            tabIndex={tabIndex}
            changeTab={changeTab}
            confirmation={currentConfirmation}
          />
        ) : (
          <SignTransaction
            tabIndex={tabIndex}
            changeTab={changeTab}
            confirmation={currentConfirmation}
            paramsInfo={paramsInfo}
            costs={costs}
          />
        )}
      </div>

      <div className={styles.signPageBottom}>
        <div className={styles.btns}>
          <div
            className={styles.btn}
            onClick={() => {
              rejectSign(currentConfirmation, selectedIndex);
            }}
          >
            {<FormattedMessage id="BUTTON.REJECT" />}
          </div>
          <div
            className={classNames(styles.btn, styles.current)}
            onClick={() => confirmSign(currentConfirmation, selectedIndex)}
          >
            {
              <FormattedMessage
                id={
                  paramsInfo?.functionName === 'approve'
                    ? 'CONFIRMATIONS.AUTH.APPROVE'
                    : 'CONFIRMATIONS.AUTH.CONFIRM'
                }
              />
            }
          </div>
        </div>

        {multiConfirmation && (
          <div className={styles.buttonClose}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setRejectConfirm(true);
              }}
            >
              <FormattedMessage
                id="CONFIRMATIONS.NEW.REJECT_ALL"
                values={{ amount: confirmations.length }}
              />
            </span>
          </div>
        )}
      </div>

      <Confirmation
        show={rejectConfirm}
        title={
          <FormattedMessage
            id="CONFIRMATIONS.NEW.IS_REJECT_ALL"
            values={{ amount: confirmations.length }}
          />
        }
        body={''}
        onClose={() => setRejectConfirm(false)}
        onConfirmed={() => rejectAllSign()}
      />

      <ApproveAddressModal
        showApproveAddressModal={showApproveAddressModal}
        onConfirm={() => {
          confirmSign(currentConfirmation, selectedIndex);
        }}
        onClose={() => {
          setShowApproveAddressModal(false);
        }}
      />

      <PrepareConnectLedgerModal
        showPrepareConnectLedger={showPrepareConnectLedger}
        onConfirm={onConfirmOpenLedgerGuide}
        onClose={() => {
          setShowPrepareConnectLedger(false);
        }}
      />

      <LedgerModal
        ledgerTips={ledgerTips}
        showLedgerLoading={showLedgerLoading}
        closeLedgerLoadingModal={() => {
          setShowLedgerLoading(false);
        }}
      />
    </div>
  );
};

export default SignPage;
