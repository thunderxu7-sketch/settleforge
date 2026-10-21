import { FC, memo } from 'react';

import type { TabInfoType } from '../../../../../../lib/extension/tab';
import defaultWebsiteIcon from '../../../../../../static/images/default_website.svg';
import closeIcon from '../../../../../../static/images/cross.svg';

import styles from '../Connected.m.scss';

interface Props {
  tabInfo?: TabInfoType;
  onClose: () => void;
}

const AddressTitlePart: FC<Props> = ({ tabInfo, onClose }) => {
  return (
    <>
      <img onClick={onClose} className={styles.closeIcon} src={closeIcon} alt="" />
      <img
        src={tabInfo?.favIconUrl || defaultWebsiteIcon}
        onError={(e) => {
          e.currentTarget.src = defaultWebsiteIcon;
        }}
        className={styles.noAddressWebsiteIcon}
        alt=""
      />
      <div className={styles.noAddressTitle}>{tabInfo?.hostname}</div>
    </>
  );
};

export default memo(AddressTitlePart);
