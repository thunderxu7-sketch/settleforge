import _ from 'lodash';
import { FC, memo } from 'react';
import dayjs from 'dayjs';
import { FormattedMessage, useIntl } from 'react-intl';
import { Popover, Tooltip } from 'antd';
import { cutMiddle } from '../../../utils';
import { bigFormat, BigNumber, formatNumber } from '../../../utils/numberUtils';

import Toast from '../../../../components/Toast';

import styles from '../TransferDetailPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

interface Props {
  txId: string;
  type: number;
  transferState: string;
  timestamp: number;
  block: number;
  fee: number;
  receipt: any;
  chainParameters: any;
  tronLinkTransactionDetail: any;
}
const TransferInfo: FC<Props> = ({
  transferState,
  txId,
  type,
  timestamp,
  block,
  fee,
  receipt,
  chainParameters,
  tronLinkTransactionDetail,
}) => {
  const { formatMessage } = useIntl();
  const transferFee = new BigNumber(fee).shiftedBy(-6).toFormat();
  const { net_usage = 0, energy_usage = 0, net_fee = 0, energy_fee = 0 } = receipt;
  const createNewAccountFeeInSystemContract = _.get(
    chainParameters,
    'getCreateNewAccountFeeInSystemContract.value',
    0,
  );
  const createAccountFee = _.get(chainParameters, 'getCreateAccountFee.value', 0);

  let isActiveNewAccount = false;
  let bandWidthFee;

  if (
    new BigNumber(net_fee).eq(createAccountFee) ||
    new BigNumber(createNewAccountFeeInSystemContract).eq(
      new BigNumber(fee).minus(net_fee).minus(energy_fee),
    )
  ) {
    bandWidthFee = formatNumber(new BigNumber(fee).plus(-energy_fee).shiftedBy(-6), {
      dp: 5,
      cutZero: true,
    });
    isActiveNewAccount = true;
  } else {
    bandWidthFee = formatNumber(new BigNumber(net_fee).shiftedBy(-6), {
      dp: 5,
      cutZero: true,
    });
  }

  let smartContractDetail = '';
  if (
    tronLinkTransactionDetail.contractType &&
    tronLinkTransactionDetail.contractType.toUpperCase() === 'TriggerSmartContract'.toUpperCase()
  ) {
    if (
      tronLinkTransactionDetail.event_type &&
      tronLinkTransactionDetail.event_type.toUpperCase() === 'Approval'.toUpperCase()
    ) {
      smartContractDetail = 'approval';
    }

    if (
      tronLinkTransactionDetail.event_type &&
      tronLinkTransactionDetail.event_type.toUpperCase() === 'Transfer'.toUpperCase()
    ) {
      smartContractDetail = 'transfer';
    }
  }

  const infoArr = [
    {
      name: formatMessage({ id: 'TRANSACTION_DETAIL.TYPE' }),
      value:
        type === 5 ? (
          <FormattedMessage id="CONTRACTS.COLLECTION.TRANSFER" />
        ) : smartContractDetail === 'approval' ? (
          <div className="typeShow" id="typePopup">
            <FormattedMessage
              id={`CONTRACTS.EVENT_TYPE.${tronLinkTransactionDetail.event_type.toUpperCase()}`}
            />
            <Popover
              placement="bottomRight"
              getPopupContainer={() => {
                return document.querySelector('#typePopup') || document.body;
              }}
              content={
                <div
                  style={{ padding: 14, background: 'rgba(80,81,96,0.90)', borderRadius: '4px' }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'hsla(0,0%,100%,.8)',
                    }}
                  >
                    <FormattedMessage id="TRANSACTION_DETAIL.CONTRACT_TYPE_TIPS" />
                  </div>
                </div>
              }
            >
              <i className={styles.toastIcon}></i>
            </Popover>
          </div>
        ) : smartContractDetail === 'transfer' ? (
          <FormattedMessage id="CONTRACTS.TriggerSmartContract.transfer" />
        ) : tronLinkTransactionDetail.contractType ? (
          <FormattedMessage id={`CONTRACTS.${tronLinkTransactionDetail.contractType}`} />
        ) : (
          ''
        ),
    },
    {
      name: formatMessage({ id: 'TRANSACTION_DETAIL.ID' }),
      value: (
        <p>
          {txId ? cutMiddle(txId, 13, 13) : '--'}
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
                await window.navigator.clipboard.writeText(txId);
              }}
            />
          </Tooltip>
        </p>
      ),
    },
    {
      name: formatMessage({ id: 'TRANSACTION_DETAIL.BLOCK' }),
      value: (
        <p>
          {block || '--'}
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
                await window.navigator.clipboard.writeText(block.toString());
              }}
            />
          </Tooltip>
        </p>
      ),
    },
    {
      name: formatMessage({ id: 'TRANSACTION_DETAIL.TIME' }),
      value: timestamp === 0 ? '--' : dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      name: (
        <p id="feePopup">
          <FormattedMessage id="TRANSACTION_DETAIL.FEE" />
          <Popover
            placement="bottomRight"
            getPopupContainer={() => {
              return document.querySelector('#feePopup') || document.body;
            }}
            content={
              <div className={styles.feePopup}>
                <div>
                  <div
                    style={{
                      borderBottom: net_fee > 0 || energy_fee > 0 ? 'thin solid #efefef5c' : '',
                      fontSize: '13px',
                    }}
                  >
                    <FormattedMessage id="TRANSACTION_DETAIL.EXPLAIN.CONSUME" />
                  </div>
                  {new BigNumber(transferFee).gt(0) ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '5px',
                        fontSize: '13px',
                        color: 'hsla(0,0%,100%,.8)',
                      }}
                    >
                      <div className="">
                        {isActiveNewAccount ? (
                          <FormattedMessage id="ACCOUNT.SEND.ACTIVATE_ACCOUNT" />
                        ) : (
                          <FormattedMessage id="ACCOUNT.SEND.BANDWIDTH_NOT_ENOUGH" />
                        )}
                      </div>
                      <div>{bandWidthFee} TRX</div>
                    </div>
                  ) : null}
                  {new BigNumber(energy_fee).gt(0) ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '5px',
                        fontSize: '13px',
                        color: 'hsla(0,0%,100%,.8)',
                      }}
                    >
                      <div className="">
                        <FormattedMessage id="ACCOUNT.SEND.ENERGY_NOT_ENOUGH" />
                      </div>
                      <div>
                        {formatNumber(new BigNumber(energy_fee).shiftedBy(-6), {
                          dp: 5,
                          cutZero: true,
                        })}{' '}
                        TRX
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            }
          >
            <i></i>
          </Popover>
        </p>
      ),
      value: `${transferFee} TRX`,
    },
    {
      name: formatMessage({ id: 'TRANSACTION_DETAIL.RESOURCE' }),
      value: (
        <>
          {bigFormat(net_usage)}&nbsp;
          <FormattedMessage id="TRANSACTIONS.BANDWIDTH" />
          &nbsp;&nbsp;&nbsp;
          {bigFormat(energy_usage)}&nbsp;
          <FormattedMessage id="TRANSACTIONS.ENERGY" />
        </>
      ),
    },
  ];

  if (smartContractDetail === 'approval') {
    infoArr.splice(1, 0, {
      name: formatMessage({ id: 'TRANSACTION_DETAIL.APPROVAL_AMOUNT' }),
      value: tronLinkTransactionDetail.approval_amount ?? '--',
    });
  }

  if (transferState !== 'SUCCESS') {
    infoArr.push({
      name: formatMessage({ id: 'TRANSACTION_DETAIL.FAILED' }),
      value: tronLinkTransactionDetail.contract_ret || '--',
    });
  }
  return (
    <div className={styles.transferInfo}>
      {infoArr.map((item) => {
        return (
          <div key={item.name as any} className={styles.infoItem}>
            <div className={styles.name}>{item.name}</div>
            <div className={styles.value}>{item.value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(TransferInfo);
