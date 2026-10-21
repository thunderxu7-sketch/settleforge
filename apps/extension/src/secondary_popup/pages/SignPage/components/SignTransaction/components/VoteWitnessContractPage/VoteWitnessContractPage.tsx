// @ts-ignore
import { FC, useState } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import TabMenu from '../../../TabMenu';
import VoteTokenDescriptor from './VoteTokenDescriptor';
import AmountInfo from '../common/AmountInfo';
import VoteTarget from './VoteTarget';
import FeeMeta from '../MetaData/Fee';
import NoteMeta from '../MetaData/Note';
import ResourceMeta from '../MetaData/Resource';
import HexDataInfo from '../HexDataInfo';
import VoteModal from '../common/VoteModal';

import { ParamsInfoType, CostsType } from '../../../../hooks';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  tabIndex: number;
  changeTab: (tabIndex: number) => void;
  contractType: string;
  confirmation: ConfirmationObj;
  paramsInfo: ParamsInfoType;
  costs: CostsType;
}
const VoteWitnessContractPage: FC<Props> = ({
  tabIndex,
  changeTab,
  contractType,
  confirmation,
  paramsInfo,
  costs,
}) => {
  const { amount, rawDataHex, superNodeInfo } = paramsInfo;
  const intl = useIntl();

  const unit = intl.formatMessage({ id: 'CONFIRMATIONS.RESOURCE.VOTE' });

  const [voteModalVisible, setVoteModalVisible] = useState(false);

  const showVoteModal = () => {
    setVoteModalVisible(true);
  };

  const hideVoteModal = () => {
    setVoteModalVisible(false);
  };

  return (
    <div className={classNames(styles.signContent, 'col', 'scroll')}>
      <VoteTokenDescriptor />
      <AmountInfo amount={amount} unit={unit} decimal={0}></AmountInfo>
      <div className={classNames(styles.transferDetail, 'scroll', 'col')}>
        <TabMenu tabIndex={tabIndex} changeTab={changeTab} />
        <div className={classNames(styles.transferTabDetail, 'scroll')}>
          {tabIndex === 0 && (
            <div className={classNames(styles.tradeDetail, 'scroll')}>
              <div className={styles.metaDataWrap}>
                {superNodeInfo && (
                  <VoteTarget superNodeInfo={superNodeInfo} showVoteModal={showVoteModal} />
                )}
                <FeeMeta costs={costs} />
                <NoteMeta comfirmation={confirmation} />
                <ResourceMeta costs={costs} />
              </div>
            </div>
          )}
          {tabIndex === 1 && (
            <div className={classNames(styles.tradeData, 'scroll')}>
              {rawDataHex && <HexDataInfo rawDataHex={rawDataHex} />}
            </div>
          )}
          {voteModalVisible && (
            <VoteModal superNodeInfo={superNodeInfo} hideVoteModal={hideVoteModal} />
          )}
        </div>
      </div>
    </div>
  );
};

export default VoteWitnessContractPage;
