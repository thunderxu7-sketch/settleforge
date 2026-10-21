import { FC, memo } from 'react';
import { useIntl } from 'react-intl';

import { TabInfoType } from '../../../../../../lib/extension/tab';
import type { ConnectedAccountType } from '../../../../../../hooks/conncted_info';
import AddressTitlePart from './AddressTitlePart';
import AddressRow from './AddressRow';
import type { ConnectedWebsiteType } from '../../../../../../store/slices/connected_website';

import styles from '../Connected.m.scss';

interface Props {
  tabInfo?: TabInfoType;
  onClose: () => void;
  connectedCount: number;
  connectedAccounts: ConnectedAccountType[];
  isSysWhiteWebSite: boolean;
  onDisconnect: (address: string, website: ConnectedWebsiteType) => void;
}

const AddressList: FC<Props> = ({
  tabInfo,
  onClose,
  connectedCount,
  connectedAccounts,
  isSysWhiteWebSite,
  onDisconnect,
}) => {
  const intl = useIntl();

  return (
    <div className={styles.container}>
      <div className={styles.addressListContainer}>
        <AddressTitlePart tabInfo={tabInfo} onClose={onClose} />

        <div
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage(
              {
                id: 'ACCOUNT.AUTH_WEBSITE.CONNECT_AMOUNT',
              },
              {
                amount: connectedCount,
                span: (chunks) =>
                  `<span class='${styles.connectedCountColor}'>${chunks.join('')}</span>`,
              },
            ),
          }}
          className={styles.connectedCountLabel}
        />
        <div className={styles.addressRowsContainer}>
          {connectedAccounts.map((ele) => {
            return (
              <AddressRow
                key={ele.address}
                tabInfo={tabInfo}
                account={ele}
                isSysWhiteWebSite={isSysWhiteWebSite}
                onDisconnect={onDisconnect}
                onClose={onClose}
              />
            );
          })}
        </div>
        <div
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage({ id: 'ACCOUNT.AUTH_WEBSITE.ADDRESS.PERMISSIONS' }),
          }}
          className={styles.permissionLabel}
        />
      </div>
    </div>
  );
};

export default memo(AddressList);
