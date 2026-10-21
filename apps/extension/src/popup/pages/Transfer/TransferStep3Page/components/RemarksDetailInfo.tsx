import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Drawer } from 'antd';

import styles from '../TransferStep3Page.m.scss';

import CloseCost from '../images/icon-close-cost.svg';

interface Props {
  remarks: string;

  showRemarksDetail: boolean;

  setShowRemarksDetail: (isShow: boolean) => void;
}
const RemarksDetailInfo: FC<Props> = ({ remarks, showRemarksDetail, setShowRemarksDetail }) => {
  return (
    <div className={styles.remarksDetailInfo} id="remarksDetailInfo">
      <Drawer
        title=" "
        placement="bottom"
        onClose={() => {
          setShowRemarksDetail(false);
        }}
        visible={showRemarksDetail}
        closeIcon={<img src={CloseCost} alt="" />}
        getContainer={() => {
          return document.querySelector('#remarksDetailInfo') ?? document.body;
        }}
      >
        <h3 className={styles.overview}>
          <FormattedMessage id="CONFIRMATIONS.SEND.NOTE" />
        </h3>

        <div className={styles.detail}>
          <p>{remarks}</p>
        </div>
      </Drawer>
    </div>
  );
};

export default memo(RemarksDetailInfo);
