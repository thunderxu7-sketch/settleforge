import { memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tooltip } from 'antd';

import TooltipImg from '../images/tooltip.svg';
import styles from '../ManualPathPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

const Tips = () => {
  const { formatMessage } = useIntl();
  const tips = (
    <>
      <p>{formatMessage({ id: 'WALLET.IMPORT.DEFINE_PATH.TIPS_1' })}</p>
      <p>{formatMessage({ id: 'WALLET.IMPORT.DEFINE_PATH.TIPS_2' })}</p>
    </>
  );

  return (
    <p className={styles.titleTips}>
      <span>
        <FormattedMessage id="HD.PATH_PARAM" />
        <Tooltip
          placement="bottom"
          overlayInnerStyle={toolTipsOverlayInnerStyle}
          title={tips}
          overlayClassName="tooltip"
          className={styles.tooltipImg}
        >
          <img src={TooltipImg} alt="" />
        </Tooltip>
      </span>
    </p>
  );
};

export default memo(Tips);
