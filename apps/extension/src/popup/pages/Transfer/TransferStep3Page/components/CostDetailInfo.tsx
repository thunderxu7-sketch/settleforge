import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Drawer } from 'antd';

import { formatNumber } from '../../../../../popup/utils/numberUtils';

import styles from '../TransferStep3Page.m.scss';

import CloseCost from '../images/icon-close-cost.svg';

interface Props {
  createAccountUseTrx: number | string;
  contractUseTrx: number | string;
  useTrx: number | string;

  showCostDetail: boolean;

  setShowCostDetail: (isShow: boolean) => void;
}
const CostDetailInfo: FC<Props> = ({
  createAccountUseTrx,
  contractUseTrx,
  useTrx,
  showCostDetail,
  setShowCostDetail,
}) => {
  return (
    <div className={styles.costDetailInfo} id="costDetailInfo">
      <Drawer
        title=" "
        placement="bottom"
        onClose={() => {
          setShowCostDetail(false);
        }}
        visible={showCostDetail}
        closeIcon={<img src={CloseCost} alt="" />}
        getContainer={() => {
          return document.querySelector('#costDetailInfo') ?? document.body;
        }}
      >
        <h3 className={styles.overview}>
          <span>
            <FormattedMessage id="CONFIRMATIONS.SEND.FEE" />
            <FormattedMessage id="CONFIRMATIONS.TITLE.PRE_CALCULATION" />
          </span>
          <span>{formatNumber(useTrx, { dp: 6, cutZero: true })}TRX</span>
        </h3>

        <div className={styles.detail}>
          {createAccountUseTrx !== 0 && (
            <p>
              <span>
                <FormattedMessage id="ACCOUNT.SEND.ACTIVATE_ACCOUNT" />
              </span>
              <span>{createAccountUseTrx} TRX</span>
            </p>
          )}
          {contractUseTrx !== 0 && (
            <p>
              <span>
                <FormattedMessage id="CONFIRMATIONS.RESOURCE.USE_TRX" />
              </span>
              <span>{contractUseTrx} TRX</span>
            </p>
          )}
          <p>
            <FormattedMessage id="CONFIRMATIONS.RESOURCE.NOT_ENOUGH_USE_TRX" />
          </p>
        </div>
      </Drawer>
    </div>
  );
};

export default memo(CostDetailInfo);
