// @ts-ignore
import { FC } from 'react';
import classNames from 'classnames';

import TabMenu from '../../../TabMenu';
import UnFreezeTokenDescriptor from './UnFreezeTokenDescriptor';
import UnFreezeAmountInfo from './UnFreezeAmountInfo';
import FeeMeta from '../MetaData/Fee';
import NoteMeta from '../MetaData/Note';
import ResourceMeta from '../MetaData/Resource';
import HexDataInfo from '../HexDataInfo';
import FreezeResourceMeta from '../MetaData/FreezeResource';
import FreezeResourceAddressMeta from '../MetaData/FreezeResourceAddress';
import FreezeTronPowerMeta from '../MetaData/FreezeTronPower';

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
const UnFreezeBalanceContractPage: FC<Props> = ({
  tabIndex,
  changeTab,
  confirmation,
  paramsInfo,
  costs,
}) => {
  const { fromAddress, toAddress, rawDataHex, unfreezeBalance, resource } = paramsInfo;

  return (
    <div className={classNames(styles.signContent, 'col', 'scroll')}>
      <UnFreezeTokenDescriptor />
      <UnFreezeAmountInfo
        frozenBalance={unfreezeBalance}
        fromAddress={fromAddress}
        toAddress={toAddress}
      />
      <div className={classNames(styles.transferDetail, 'scroll', 'col')}>
        <TabMenu tabIndex={tabIndex} changeTab={changeTab} />
        <div className={classNames(styles.transferTabDetail, 'scroll')}>
          {tabIndex === 0 && (
            <div className={classNames(styles.tradeDetail, 'scroll')}>
              <div className={styles.metaDataWrap}>
                <FreezeResourceMeta type="UNFREEZE" resource={resource} />
                <FreezeResourceAddressMeta type="UNFREEZE" toAddress={toAddress} />
                <FreezeTronPowerMeta type="UNFREEZE" balance={unfreezeBalance} />
                <FeeMeta costs={costs} />
                <NoteMeta comfirmation={confirmation} />
                <ResourceMeta costs={costs} />
              </div>
            </div>
          )}
          {tabIndex === 1 && (
            <div className={classNames(styles.tradeData, 'scroll')}>
              <HexDataInfo rawDataHex={rawDataHex} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnFreezeBalanceContractPage;
