import { memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tooltip } from 'antd';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

import TooltipImg from '../images/tooltip.svg';
import styles from '../LedgerPathPage.m.scss';

const Tips = () => {
  const { formatMessage } = useIntl();

  const title = (
    <>
      <p>{formatMessage({ id: 'WALLET.IMPORT.DEFINE_PATH.TIPS_1' })}</p>
      <p>{formatMessage({ id: 'WALLET.IMPORT.DEFINE_PATH.TIPS_2' })}</p>
    </>
  );

  return (
    <p className={styles.titleTips}>
      <span>
        <FormattedMessage id="WALLT.IMPORT.MNEMONIC_PATH" />
        <Tooltip
          placement="bottom"
          overlayInnerStyle={toolTipsOverlayInnerStyle}
          title={title}
          className={styles.tooltipImg}
        >
          <img src={TooltipImg} alt="" />
        </Tooltip>
      </span>
    </p>
  );
};

export default memo(Tips);
