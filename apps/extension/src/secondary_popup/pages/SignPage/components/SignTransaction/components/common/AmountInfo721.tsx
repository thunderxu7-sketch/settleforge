import { FC } from 'react';

import { formatNumber } from '../../../../../../../popup/utils/numberUtils';
import { isCustomToken } from '../../../../utils';
import { BigNumberType } from '../../../../../../../constants/types';

import ResizableText from '../../../../../../../components/ResizableText';

import token10DefaultImg from '../../../../../../../static/images/token_10_default.svg';
import tokenCustomDefaultImg from '../../../../../../../static/images/token_custom_default.svg';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  amount: string | BigNumberType;
  unit: string;
  tokenInfo: Record<string, any>;
}
const AmountInfo721: FC<Props> = ({ amount, unit, tokenInfo }) => {
  const { logoUrl = '', tokenStatus, assetName = '' } = tokenInfo || {};
  const isCustom = isCustomToken(tokenStatus);
  return (
    <div className={styles.amountInfo}>
      <div className={styles.num}>
        <ResizableText
          initSize={16}
          text={`#${formatNumber(amount, {
            dp: 0,
            cutZero: true,
            separator: false,
          })} ${assetName ?? ''}`}
        />
      </div>
      <div className={styles.unit}>
        {logoUrl && (
          <img
            src={isCustom ? { tokenCustomDefaultImg } : logoUrl}
            style={{ width: '16px' }}
            alt=""
            onError={(e) => {
              e.target.src = token10DefaultImg;
            }}
          />
        )}{' '}
        {unit}
      </div>
    </div>
  );
};

export default AmountInfo721;
