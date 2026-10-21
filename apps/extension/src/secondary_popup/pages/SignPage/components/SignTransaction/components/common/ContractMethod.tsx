import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import _ from 'lodash';
import classNames from 'classnames';

import { BigNumberType } from '../../../../../../../constants/types';
import styles from '../../../../static/scss/common.m.scss';

interface Props {
  functionSelector: string;
  args: Array<{ name: string; value: number | BigNumberType | string }>;
}
const ContractMethod: FC<Props> = ({ functionSelector, args }) => {
  const { formatMessage } = useIntl();
  return (
    <div className={styles.metaDataWrap}>
      <div className={classNames(styles.item, styles.noBorder)}>
        <div className={styles.title}>
          <FormattedMessage id="CONFIRMATIONS.CONTRACT.FUNCTION_NAME" />
        </div>
        <div className={styles.content}>
          {functionSelector
            ? functionSelector
            : formatMessage({ id: 'CONFIRMATIONS.FUNCTION.UNKNOWN' })}
        </div>
      </div>
      {_.size(args) > 0 ? (
        <div className={styles.valueWrap}>
          {args.map(({ name, value }, index) => {
            return (
              <div key={index} className={classNames(styles.item, styles.column)}>
                <div className={styles.title}>{name}:</div>
                <div className={styles.content}>{value}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.separator} style={{ margin: '8px 0' }} />
      )}
    </div>
  );
};

export default ContractMethod;
