import { FormattedMessage } from 'react-intl';
import styles from '../../../../static/scss/common.m.scss';

const RiskTokenTip = () => {
  return (
    <div className={styles.riskTokenTip}>
      <FormattedMessage id={'ASSET.ASSET_MANAGE.RISK_TOKEN.TIP'} />
    </div>
  );
};

export default RiskTokenTip;
