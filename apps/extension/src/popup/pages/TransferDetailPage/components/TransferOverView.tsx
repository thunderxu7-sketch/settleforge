import { FC, memo } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tooltip } from 'antd';

import { cutMiddle } from '../../../utils';
import { BigNumber } from '../../../utils/numberUtils';
import Toast from '../../../../components/Toast';
import ResizableText from '../../../../components/ResizableText';

import styles from '../TransferDetailPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

import TransferSuccess from '../images/icon-transfer-success.svg';
import TransferFail from '../images/icon-transfer-fail.svg';

interface Props {
  transferState: string;
  precision: number;
  type: number;
  selectedAddress: string;
  remarks: string;
  shortName: string;
  tronLinkTransactionDetail: any;
}
const TransferOverView: FC<Props> = ({
  transferState,
  precision,
  type,
  selectedAddress,
  remarks,
  shortName,
  tronLinkTransactionDetail,
}) => {
  const { formatMessage } = useIntl();
  const transferImg = transferState === 'SUCCESS' ? TransferSuccess : TransferFail;
  const toAddress = tronLinkTransactionDetail.toAddress;
  const fromAddress = tronLinkTransactionDetail.fromAddress;
  const amount = tronLinkTransactionDetail.amount ?? 0;
  const quant = tronLinkTransactionDetail.quant;

  const defaultAddress =
    tronLinkTransactionDetail?.contractType?.toUpperCase() ===
    'WithdrawBalanceContract'.toUpperCase()
      ? fromAddress || toAddress
      : '-';
  const showFromAddress = fromAddress || defaultAddress;
  const showToAddress = toAddress || defaultAddress;

  const direction =
    toAddress === fromAddress ? 'send' : toAddress === selectedAddress ? 'receive' : 'send';

  return (
    <div className={styles.transferOverView}>
      <div className={styles.overViewImg}>
        <img src={transferImg} />
      </div>
      {type === 5 ? (
        <p
          className={classNames(
            styles.assetId,
            direction === 'receive' ? styles.green : styles.red,
          )}
        >
          <span>
            <ResizableText initSize={18} text={`# ${quant || ''}`} />
          </span>
        </p>
      ) : (
        <p
          className={classNames(
            styles.amount,
            direction === 'receive' ? styles.green : styles.grey,
          )}
        >
          <ResizableText
            initSize={18}
            text={`${direction === 'receive' ? '+' : '-'} ${new BigNumber(amount)
              .shiftedBy(-precision)
              .toFormat()} ${shortName}`}
          />
        </p>
      )}
      <div className={styles.accountAddress}>
        <div className={styles.addressInfo}>
          <p className={classNames(styles.title, styles.from)}>
            <i></i>
            <FormattedMessage id="TRANSACTION_DETAIL.FROM_ADDRESS" />
          </p>
          <p className={styles.address}>
            {cutMiddle(showFromAddress, 15, 15)}
            {showFromAddress !== '-' && (
              <Tooltip
                overlayInnerStyle={toolTipsOverlayInnerStyle}
                title={formatMessage({
                  id: 'TOOLTIP.COPY',
                })}
              >
                <i
                  onClick={async (e) => {
                    Toast.show({
                      icon: 'success',
                      content: formatMessage({ id: 'TOAST.COPY' }),
                    });
                    await window.navigator.clipboard.writeText(showFromAddress);
                  }}
                />
              </Tooltip>
            )}
          </p>
        </div>
        <div className={styles.addressInfo}>
          <p className={styles.title}>
            <i></i>
            <FormattedMessage id="TRANSACTION_DETAIL.RECEIVE_ADDRESS" />
          </p>
          <p className={styles.address}>
            {cutMiddle(showToAddress, 15, 15)}
            {showToAddress !== '-' && (
              <Tooltip
                overlayInnerStyle={toolTipsOverlayInnerStyle}
                title={formatMessage({
                  id: 'TOOLTIP.COPY',
                })}
              >
                <i
                  onClick={async (e) => {
                    Toast.show({
                      icon: 'success',
                      content: formatMessage({ id: 'TOAST.COPY' }),
                    });
                    await window.navigator.clipboard.writeText(showToAddress);
                  }}
                />
              </Tooltip>
            )}
          </p>
        </div>

        {remarks && (
          <div className={styles.addressInfo}>
            <p className={styles.title}>
              <FormattedMessage id="TRANSACTION_DETAIL.REMARK" />
            </p>
            <p className={styles.address} style={{ display: 'block' }}>
              {remarks}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(TransferOverView);
