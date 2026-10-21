import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  callValue: string;
  callValueUnit: string;
  callTokenValue: string;
  callTokenValueUnit: string;
}
const CallTokenValue: FC<Props> = ({
  callValue,
  callValueUnit,
  callTokenValue,
  callTokenValueUnit,
}) => {
  return (
    <div className={styles.item}>
      <div className={styles.title}>
        <FormattedMessage id={'CONFIRMATIONS.TRIGGER.AMOUNT'} />
      </div>
      <div className={styles.content}>
        {callValue && (
          <span>
            <span className={styles.callValue}>{callValue}</span> <span>{callValueUnit}</span>
          </span>
        )}
        {callTokenValue && (
          <span>
            {' '}
            {callValue && <span>+</span>} <span className={styles.callValue}>{callTokenValue}</span>{' '}
            <span>{callTokenValueUnit}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default CallTokenValue;
