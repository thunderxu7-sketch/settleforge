import { FC } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from '../../../static/scss/common.m.scss';

interface Props {
  data: string;
}
const Details: FC<Props> = ({ data }) => {
  return (
    <div className={styles.details}>
      <div className={styles.title}>
        <FormattedMessage id="CONFIRMATION.STRING.CONTENT" />
      </div>
      <div className={styles.valueWrap}>{data}</div>
    </div>
  );
};

export default Details;
