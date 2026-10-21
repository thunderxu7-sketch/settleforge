import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from '../LoginPage.m.scss';

interface Props {
  errorMsgID: string;
}

export const Error: FC<Props> = ({ errorMsgID }) => {
  return (
    <div className={styles.errorContainer}>
      {errorMsgID && <FormattedMessage id={errorMsgID} />}
    </div>
  );
};

export default memo(Error);
