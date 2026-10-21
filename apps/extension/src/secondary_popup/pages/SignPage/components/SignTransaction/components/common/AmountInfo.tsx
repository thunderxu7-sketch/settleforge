import { FC } from 'react';

import { formatNumber } from '../../../../../../../popup/utils/numberUtils';

import ResizableText from '../../../../../../../components/ResizableText';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  amount: BigNumber | string;
  unit: string;
  decimal: number;
}
const AmountInfo: FC<Props> = ({ amount, unit, decimal }) => {
  return (
    <div className={styles.amountInfo}>
      <span>
        <ResizableText
          initSize={16}
          text={`${formatNumber(amount, {
            dp: decimal,
            cutZero: true,
          })} ${unit}`}
        />
      </span>
    </div>
  );
};

export default AmountInfo;
