import { FC } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './TronscanFooter.m.scss';

import TronscanIcon from './images/icon-tronscan.svg';

interface Props {
  tronscanUrl: string;
}

const TronscanFooter: FC<Props> = ({ tronscanUrl }) => {
  return (
    <div className={styles.tronscanFooter}>
      <div className={styles.tronscanIcon}>
        <img src={TronscanIcon} />
      </div>

      <div
        className={styles.toTronscan}
        onClick={() => {
          window.open(tronscanUrl, 'tronscan');
        }}
      >
        <FormattedMessage id="ASSET.COLLECTION.VIEW" />
        <i></i>
      </div>
    </div>
  );
};

export default TronscanFooter;
