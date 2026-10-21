import { FC, memo } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

import TronIcon from '../images/tron.svg';
import defaultWebsiteIcon from '../images/default_website.svg';
import MiddlePartIcon from '../images/middle_part.svg';

import styles from '../ConnectWebsitePage.m.scss';

interface Props {
  websiteIcon: string;
  hostname: string;
}

const WebsiteInfo: FC<Props> = ({ websiteIcon, hostname }) => {
  return (
    <div className={classNames(styles.websiteInfoContainer, 'col')}>
      <div className={classNames(styles.websiteIcons, 'row', 'center', 'spaceBetween')}>
        <img src={websiteIcon || defaultWebsiteIcon} className={styles.websiteIcon} alt="" />
        <img src={MiddlePartIcon} className={styles.middlePartIcon} alt="" />
        <img src={TronIcon} className={styles.websiteIcon} alt="" />
      </div>

      <div className={styles.hostname}>{hostname}</div>

      <div className={styles.websiteTip}>
        <FormattedMessage id="APPROVE_ACCOUNT.REQUEST_AUTH.TIP" />
      </div>
    </div>
  );
};

export default memo(WebsiteInfo);
