import { FC } from 'react';
import _ from 'lodash';
import { useIntl, FormattedMessage } from 'react-intl';

import { CostsType } from '../../../../hooks';
import { formatNumber } from '../../../../../../../popup/utils/numberUtils';
import iconLoading from '../../../../static/images/icon-loading-transaction.svg';
import styles from '../../../../static/scss/common.m.scss';

interface Props {
  costs: CostsType;
}

const ResourceMeta: FC<Props> = ({ costs }) => {
  const costEnergy = _.get(costs, 'costEnergy', 0);
  const costBandwidth = _.get(costs, 'costBandwidth', 0);
  const intl = useIntl();
  const { formatMessage } = intl;
  const title =
    formatMessage({ id: 'CONFIRMATIONS.SEND.RESOURCE' }) +
    ' ' +
    formatMessage({ id: 'CONFIRMATIONS.TITLE.PRE_CALCULATION' });
  return (
    <div className={styles.item}>
      <div className={styles.title}>{title}</div>
      <div className={styles.content}>
        {costBandwidth === '--' ? (
          <img src={iconLoading} />
        ) : (
          <div className="resource">
            {formatNumber(costBandwidth, { cutZero: true })}{' '}
            <FormattedMessage id={'TRANSACTIONS.BANDWIDTH'} />
            {costEnergy > 0 && (
              <span>
                {' '}
                + {formatNumber(costEnergy, { cutZero: true })}{' '}
                <FormattedMessage id={'TRANSACTIONS.ENERGY'} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceMeta;
