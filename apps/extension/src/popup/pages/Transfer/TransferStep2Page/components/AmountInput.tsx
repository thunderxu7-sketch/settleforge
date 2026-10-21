import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Input } from 'antd';
import classNames from 'classnames';

import { _toFormat, BigNumber } from '../../../../utils/numberUtils';

import { AssetItemType } from '../../../../../constants/types';

import styles from '../TransferStep2Page.m.scss';

interface Props {
  tokenAmount: string;
  tokenValue: string;
  amountStatus: string;
  amountTips: string;
  symbol: string;
  selectedToken: AssetItemType;
  setTokenAmount: (amount: string, from: string) => void;
  quicklyInputMaxAmount: () => void;
}

const AmountInput: FC<Props> = ({
  tokenAmount,
  tokenValue,
  amountStatus,
  amountTips,
  symbol,
  selectedToken,
  setTokenAmount,
  quicklyInputMaxAmount,
}) => {
  const validDecimals =
    (!selectedToken?.precision
      ? ''
      : '0.' + new Array(selectedToken.precision - 1).fill(0).join('')) + '1';
  const tokenAmountShow = _toFormat(tokenAmount);
  const maxAmount = selectedToken.balanceStr;
  return (
    <div className={styles.amountInput}>
      <p className={styles.title}>
        <FormattedMessage id="CONFIRMATIONS.QUANTITY" />
      </p>
      <div className={styles.inputBox}>
        <div className={styles.customInput}>
          <Input
            allowClear
            value={tokenAmountShow}
            placeholder="0"
            autoComplete="off"
            onChange={(e) => {
              setTokenAmount(e.target.value, '');
            }}
          />
          <div className={styles.price}>{tokenValue}</div>
        </div>

        {tokenAmountShow.length === 0 ? (
          <div
            className={styles.quicklyInput}
            onClick={() => {
              quicklyInputMaxAmount();
            }}
          >
            MAX
          </div>
        ) : (
          ''
        )}
      </div>
      <p className={styles.maxAmount}>
        <FormattedMessage
          id="ACCOUNT.SEND.TOKEN_MAX_AMOUNT"
          values={{
            span: (value: any) => <span>{value}</span>,
            amount: new BigNumber(maxAmount).isNaN() ? 0 : new BigNumber(maxAmount).toFormat(),
            symbol: selectedToken.shortName,
          }}
        />
      </p>
      {amountTips.length > 0 && (
        <p
          className={classNames(
            styles.amountTips,
            amountStatus === 'error'
              ? styles.error
              : amountStatus === 'warn'
              ? styles.warn
              : amountStatus === 'info'
              ? styles.info
              : '',
          )}
        >
          <i></i>
          <FormattedMessage id={amountTips} values={{ decimals: validDecimals }} />
        </p>
      )}
    </div>
  );
};

export default memo(AmountInput);
