import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import type { PageDeviceStatusType } from '../types';

import styles from '../LedgerImportGuidePage.m.scss';

interface Props {
  onClick: () => void;
  isConnecting: boolean;
  deviceStatus: PageDeviceStatusType;
  isRetry: boolean;
}

const Button: FC<Props> = ({ onClick, isConnecting, isRetry, deviceStatus }) => {
  if (isConnecting && deviceStatus != 'UNAUTHORIZED') {
    return null;
  }

  let labelId = 'BUTTON.NEXT_STEP';
  if (isConnecting) {
    labelId = 'BUTTON.NEXT_STEP';
  } else if (isRetry) {
    labelId = 'CREATION.LEDGER.CHOOSE_ADDRESS.RETRY';
  } else if (deviceStatus == 'UNAUTHORIZED') {
    labelId = 'BUTTON.NEXT_STEP';
  }

  return (
    <div
      onClick={onClick}
      className={classNames(styles.nextButton, {
        [styles.isLoading]: isConnecting || deviceStatus == 'AUTHORIZED',
      })}
    >
      <FormattedMessage id={labelId} />
      {isConnecting && <div className={classNames('loadingSpiny', styles.loadingIcon)} />}
    </div>
  );
};

export default memo(Button);
