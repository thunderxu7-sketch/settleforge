import { FC, memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';

import type { ConnectedAccountType } from '../../../../../../hooks/conncted_info';
import type { ConnectedWebsiteType } from '../../../../../../store/slices/connected_website';
import { TabInfoType } from '../../../../../../lib/extension/tab';
import { msgNode } from '../../../../../inst';
import Toast from '../../../../../../components/Toast';
import { callConnectWebsiteService } from '../../../../../../service/connect_website';
import { callSetSelectedAddressService } from '../../../../../../service/selected_address_service';
import { cutMiddle } from '../../../../../utils';

import styles from '../Connected.m.scss';

interface Props {
  tabInfo?: TabInfoType;
  account: ConnectedAccountType;
  onDisconnect: (address: string, website: ConnectedWebsiteType) => void;
  onClose: () => void;
  isSysWhiteWebSite: boolean;
}

const AddressRow: FC<Props> = ({ tabInfo, account, onDisconnect, isSysWhiteWebSite, onClose }) => {
  const intl = useIntl();

  const doConnect = useCallback(async () => {
    Toast.show({
      icon: 'loading',
      duration: 0,
    });
    const { hostname, favIconUrl, origin, title } = tabInfo!;
    const webInfo = {
      origin,
      hostname: hostname!,
      websiteName: title,
      websiteIcon: favIconUrl,
    };
    await callConnectWebsiteService(msgNode, {
      address: account.address,
      webInfo,
    });
    onClose();
    Toast.show({
      content: intl.formatMessage({ id: 'ACCOUNT.AUTH_WEBSITE.ADDRESS.CONNECTED' }),
      duration: 1000,
    });
  }, [account, onClose, intl, tabInfo]);

  const switchTo = useCallback(async () => {
    await callSetSelectedAddressService(msgNode, { address: account.address });
    onClose();
  }, [account.address, onClose]);

  return (
    <div className={styles.addressRow}>
      <div className={styles.addressRowLeftPart}>
        <div className={styles.accountNameContainer}>
          {account.isCurrent && <div className={styles.nameCircle} />}
          <div className={styles.accountName}>{account.name}</div>
          {account.isCurrent && (
            <div className={styles.currentAccount}>
              (<FormattedMessage id={'ACCOUNT.AUTH_WEBSITE.CURRENT_ACCOUNT'} />)
            </div>
          )}
        </div>
        <div
          className={classNames(styles.address, {
            [styles.isCurrent]: account.isCurrent,
          })}
        >
          {cutMiddle(account.address)}
        </div>
      </div>
      <div className={styles.addressRowRightPart}>
        {!account.isCurrent && (
          <div onClick={switchTo} className={styles.switchButton}>
            <FormattedMessage id={'ACCOUNT.AUTH_WEBSITE.SWITCH_ACCOUNT'} />
          </div>
        )}

        {account.isCurrent && !account.isConnected && (
          <button onClick={doConnect} className={styles.connectButton}>
            <FormattedMessage id={'BUTTON.CONNECT'} />
          </button>
        )}
        {!isSysWhiteWebSite && account.isConnected && (
          <div
            onClick={() => onDisconnect(account.address, account.webInfo!)}
            className={styles.disconnectButton}
          >
            <FormattedMessage id={'BUTTON.DISCONNECTION'} />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(AddressRow);
