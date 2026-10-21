import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import ResizableText from '../../../../../components/ResizableText';

import styles from '../TransferStep3Page.m.scss';

import transferDefault from '../images/icon-transfer-default.svg';
import { formatNumber } from '../../../../utils/numberUtils';

interface Props {
  tokenImg: string;
  isOfficial: number;
  transferAmount: number | string;
  shortName: string;
  isRiskToken: boolean;
  precision: number;
}
const TokenDetail: FC<Props> = ({
  tokenImg,
  isOfficial,
  transferAmount,
  shortName,
  isRiskToken,
  precision,
}) => {
  return (
    <div className={styles.tokenDetail}>
      <div className={styles.transferImg}>
        <img src={transferDefault} alt="" />
        <div className={styles.tokenImg}>
          <img src={tokenImg} alt="" />
          {isOfficial === 1 && <i></i>}
        </div>
      </div>
      <h1 className={styles.title}>
        <FormattedMessage id="CONFIRMATIONS.TYPE.TRANSFER" />
      </h1>
      <p className={styles.amount}>
        <ResizableText
          initSize={16}
          text={`${formatNumber(transferAmount, { cutZero: true, dp: precision })} ${shortName}`}
        />
      </p>
      {isRiskToken && (
        <p className={styles.warning}>
          <i></i> <FormattedMessage id="ACCOUNT.SEND.TIPS_TOKEN_IS_CHEAT" />
        </p>
      )}
    </div>
  );
};

export default memo(TokenDetail);
