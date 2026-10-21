import { FC } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from '../../../static/scss/common.m.scss';

interface Props {
  rawDataHex: string;
}
const HexDataInfo: FC<Props> = ({ rawDataHex }) => {
  return (
    <div className={styles.hexDataInfo}>
      <div className={styles.partOne}>
        <FormattedMessage id="CONFIRMATIONS.CONTRACT.DATA_HEX" />
      </div>
      <div className={styles.valueWrap}>{rawDataHex}</div>
    </div>
  );
};

export default HexDataInfo;
