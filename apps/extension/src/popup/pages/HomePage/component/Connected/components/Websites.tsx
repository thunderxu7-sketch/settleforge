import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import { useAddressInfo } from '../../../../../../hooks/address_info';
import { useAppSelector } from '../../../../../../store/hooks';
import { cutMiddle } from '../../../../../utils';
import {
  ConnectedWebsiteType,
  selectConnectedWebsiteInfo,
} from '../../../../../../store/slices/connected_website';
import { sysWhiteList } from '../../../../../../domain/request_accounts_manager';

import defaultWebsiteIcon from '../../../../../../static/images/default_website.svg';
import closeIcon from '../../../../../../static/images/cross.svg';

import styles from '../Connected.m.scss';
import { Tooltip } from 'antd';
import { toolTipsOverlayInnerStyle } from '../../../../../../constants/style_object';

interface Props {
  name: string;
  onClose: () => void;
  onDelete: (address: string, website: ConnectedWebsiteType) => void;
}

const Websites: FC<Props> = ({ name, onClose, onDelete }) => {
  const { addressInfo } = useAddressInfo();
  const connectedWebsiteInfo = useAppSelector(selectConnectedWebsiteInfo);

  let formatName = name;
  if (formatName.length > 12) {
    formatName = cutMiddle(formatName, 5, 5);
  }

  const websitesList = [
    ...sysWhiteList,
    ...(connectedWebsiteInfo[addressInfo.selectedAddress] || []),
  ];

  return (
    <div className={styles.websitesContainer}>
      <img onClick={onClose} src={closeIcon} className={styles.closeIcon} alt="" />
      <div className={styles.title}>
        <FormattedMessage id="ACCOUNT.AUTH_WEBSITE.CONNECTED" />
      </div>

      <div className={styles.connectedCount}>
        <FormattedMessage
          id="ACCOUNT.AUTH_WEBSITE.CONNECTED_ADDRESS"
          values={{ address: formatName }}
        />
      </div>

      <div className={styles.websiteList}>
        {websitesList.map((ele) => {
          return (
            <div key={ele.origin} className={styles.websiteRow}>
              <img
                src={ele.websiteIcon || defaultWebsiteIcon}
                onError={(e) => {
                  e.currentTarget.src = defaultWebsiteIcon;
                }}
                className={styles.websiteIcon}
                alt=""
              />

              <div className={styles.rightPart}>
                <Tooltip
                  title={ele.websiteName}
                  placement="topLeft"
                  overlayInnerStyle={toolTipsOverlayInnerStyle}
                  overlayStyle={{
                    paddingBottom: '2px',
                  }}
                >
                  <div className={styles.websiteName}>{ele.websiteName}</div>
                </Tooltip>

                <Tooltip
                  title={ele.hostname}
                  placement="topLeft"
                  overlayInnerStyle={toolTipsOverlayInnerStyle}
                  overlayStyle={{
                    paddingBottom: '2px',
                  }}
                >
                  <div className={styles.hostname}>{ele.hostname}</div>
                </Tooltip>
              </div>

              {!ele.isSysWhiteWebSite && (
                <div
                  onClick={() => onDelete(addressInfo.selectedAddress, ele)}
                  className={styles.deleteIcon}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(Websites);
