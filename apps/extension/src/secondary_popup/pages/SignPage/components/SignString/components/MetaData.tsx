import { FormattedMessage } from 'react-intl';

import styles from '../../../static/scss/common.m.scss';
interface Props {
  data: string;
}
const MetaData: FC<Props> = ({ data }) => {
  return (
    <div className={styles.metaData}>
      <div className={styles.title}>
        <FormattedMessage id="CONFIRMATIONS.CONTRACT.DATA_HEX" />
      </div>
      <div className={styles.valueWrap}>{data}</div>
    </div>
  );
};

export default MetaData;
