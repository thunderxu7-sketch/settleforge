import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import AddressTitlePart from './AddressTitlePart';
import { TabInfoType } from '../../../../../../lib/extension/tab';

import styles from '../Connected.m.scss';

interface Props {
  tabInfo?: TabInfoType;
  onClose: () => void;
}

const NoAddress: FC<Props> = ({ tabInfo, onClose }) => {
  const intl = useIntl();

  return (
    <div className={styles.container}>
      <div className={styles.noAddressContainer}>
        <AddressTitlePart tabInfo={tabInfo} onClose={onClose} />
        <div className={styles.noAddressLabel}>
          <div
            dangerouslySetInnerHTML={{
              __html: intl.formatMessage({ id: 'ACCOUNT.AUTH_WEBSITE.NO_CONNECT' }),
            }}
          />
        </div>

        <button onClick={onClose} className={styles.noAddressButton}>
          <FormattedMessage id="BUTTON.GOT_IT" />
        </button>
      </div>
    </div>
  );
};

export default memo(NoAddress);
