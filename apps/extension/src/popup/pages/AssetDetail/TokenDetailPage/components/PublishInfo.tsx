import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
// @ts-ignore
import dayjs from 'dayjs';
import { formatNumber } from '../../../../utils/numberUtils';

import styles from '../TokenDetailPage.m.scss';

type Info = {
  name: string;
  value: string | number;
};

interface Props {
  type: number;
  totalSupply: number;
  issueTime: string;
  transferCount: number;
  nrOfTokenHolders: number;
}

const PublishInfo: FC<Props> = ({
  type,
  totalSupply,
  issueTime,
  transferCount,
  nrOfTokenHolders,
}) => {
  const { formatMessage } = useIntl();

  let infoArr: Info[] = [
    {
      name: formatMessage({ id: 'ASSET.TOKEN.RELEASE_AMOUNT' }),
      value: formatNumber(totalSupply, { separator: false, cutZero: true }),
    },
  ];

  if (type === 2) {
    infoArr.splice(0, 0, {
      name: formatMessage({ id: 'ASSET.COLLECTION.ISSUING_TIME' }),
      value: issueTime ? dayjs(issueTime).format('YYYY-MM-DD HH:mm') : '--',
    });
  }
  if (type === 5) {
    infoArr = [
      {
        name: formatMessage({ id: 'ASSET.COLLECTION.SUPPLY' }),
        value: formatNumber(totalSupply, { separator: false, cutZero: true }),
      },
      {
        name: formatMessage({ id: 'ASSET.COLLECTION.HOLDER' }),
        value: nrOfTokenHolders ?? '--',
      },
      {
        name: formatMessage({ id: 'ASSET.COLLECTION.TRANSACTION_AMOUNT' }),
        value: formatNumber(transferCount, { separator: false, cutZero: true }),
      },
    ];
  }
  return (
    <div className={styles.publishInfo}>
      <div className={styles.title}>
        <i></i>
        <FormattedMessage id="ASSET.TOKEN.RELEASE_INFO" />
      </div>
      <div className={styles.infoList}>
        {infoArr.map((item) => {
          return (
            <div key={item.name} className={styles.infoItem}>
              <p className={styles.name}>{item.name}</p>
              <p className={styles.value}>{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(PublishInfo);
