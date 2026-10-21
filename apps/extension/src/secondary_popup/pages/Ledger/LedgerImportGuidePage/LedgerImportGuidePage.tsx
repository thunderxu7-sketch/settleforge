import { FormattedMessage } from 'react-intl';

import { useLedgerImportBiz } from './hook';

import ProgressBar from './components/ProgressBar';
import ProgressLabels from './components/ProgressLabels';
import ProgressPic from './components/ProgressPic';
import Notice from './components/Notice';
import Button from './components/Button';
import HelpLink from './components/HelpLink';
import Confirmation from '../../../../components/Confirmation';

const LedgerImportGuidePage = () => {
  const { state, hasAddress, checkStatus, toggleConfirmationVisible, gotoSettingPage } =
    useLedgerImportBiz();

  return (
    <>
      <ProgressBar deviceStatus={state.deviceStatus} isConnecting={state.isConnecting} />
      <ProgressLabels deviceStatus={state.deviceStatus} />
      <ProgressPic deviceStatus={state.deviceStatus} />

      <Notice
        deviceStatus={state.deviceStatus}
        isRetry={state.isRetry}
        isSwitchVisible={hasAddress}
        onClickSwitch={toggleConfirmationVisible}
      />

      <Button
        onClick={checkStatus}
        isConnecting={state.isConnecting}
        deviceStatus={state.deviceStatus}
        isRetry={state.isRetry}
      />

      <HelpLink deviceStatus={state.deviceStatus} />

      <Confirmation
        show={state.isConfirmationVisible}
        title={<FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.CONFIRM_CHECK_TITLE" />}
        body={<FormattedMessage id="WALLET.LEDGER.CONNECT.STEP_2.CONFIRM_CHECK_BODY" />}
        onClose={toggleConfirmationVisible}
        onConfirmed={gotoSettingPage}
      />
    </>
  );
};

export default LedgerImportGuidePage;
