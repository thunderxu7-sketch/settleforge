// @ts-ignore
import { FC } from 'react';
import classNames from 'classnames';

import TabMenu from '../../../TabMenu';
import FreezeTokenDescriptor from './FreezeTokenDescriptor';
import FreezeAmountInfo from './FreezeAmountInfo';
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
const FreezeBalanceContractPage: FC<Props> = ({
  tabIndex,
  changeTab,
  confirmation,
  paramsInfo,
  costs,
}) => {
  const { fromAddress, toAddress, rawDataHex, frozenBalance, resource } = paramsInfo;

  return (
    <div className={classNames(styles.signContent, 'col', 'scroll')}>
      <FreezeTokenDescriptor />
      <FreezeAmountInfo
        frozenBalance={frozenBalance}
        fromAddress={fromAddress}
        toAddress={toAddress}
      />
      <div className={classNames(styles.transferDetail, 'scroll', 'col')}>
        <TabMenu tabIndex={tabIndex} changeTab={changeTab} />
        <div className={classNames(styles.transferTabDetail, 'scroll')}>
          {tabIndex === 0 && (
            <div className={classNames(styles.tradeDetail, 'scroll')}>
              <div className={styles.metaDataWrap}>
                <FreezeResourceMeta type="FREEZE" resource={resource} />
                <FreezeResourceAddressMeta type="FREEZE" toAddress={toAddress} />
                <FreezeTronPowerMeta type="FREEZE" balance={frozenBalance} />
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

export default FreezeBalanceContractPage;
