import { FC } from 'react';

import classNames from 'classnames';
import TabMenu from '../../../../TabMenu';
import TokenDescriptor from './TokenDescriptor';
import CallTokenValueMeta from '../../MetaData/CallTokenValue';
import ContractCalledMeta from '../../MetaData/ContractCalled';
import FeeMeta from '../../MetaData/Fee';
import NoteMeta from '../../MetaData/Note';
import ResourceMeta from '../../MetaData/Resource';
import HexDataInfo from '../../HexDataInfo';
import ContractMethod from '../../common/ContractMethod';

import { ParamsInfoType, CostsType } from '../../../../../hooks';

import styles from '../../../../../static/scss/common.m.scss';
import { ConfirmationObj } from '../../../../../../../../domain/sign_manager';

interface Props {
  tabIndex: number;
  changeTab: (tabIndex: number) => void;
  paramsInfo: ParamsInfoType;
  costs: CostsType;
  confirmation: ConfirmationObj;
}
const OtherTriggerSmartContractPage: FC<Props> = ({
  tabIndex,
  changeTab,
  paramsInfo,
  costs,
  confirmation,
}) => {
  const {
    rawDataHex,
    contractAddress,
    tokenInfo,
    args,
    callValue,
    callTokenValue,
    callValueUnit,
    callTokenValueUnit,
  } = paramsInfo;
  const functionSelector = confirmation?.input?.function_selector;
  const shortName = tokenInfo?.shortName;
  return (
    <div>
      <TokenDescriptor />
      <div className={classNames(styles.transferDetail, 'scroll', 'col')}>
        <TabMenu tabIndex={tabIndex} changeTab={changeTab} />
        <div className={classNames(styles.transferTabDetail, 'scroll')}>
          {tabIndex === 0 && (
            <div className={classNames(styles.tradeDetail, 'scroll')}>
              <div className={styles.metaDataWrap}>
                {(callValue || callTokenValue) && (
                  <CallTokenValueMeta
                    callValue={callValue}
                    callValueUnit={callValueUnit}
                    callTokenValue={callTokenValue}
                    callTokenValueUnit={callTokenValueUnit}
                  />
                )}
                <ContractCalledMeta shortName={shortName} contractAddress={contractAddress} />
                <NoteMeta comfirmation={confirmation} />
                <FeeMeta costs={costs} />
                <ResourceMeta costs={costs} />
              </div>
            </div>
          )}
          {tabIndex === 1 && (
            <div className={classNames(styles.tradeData, 'scroll', 'col')}>
              <div className={classNames(styles.tradeDetail, 'scroll')}>
                <ContractMethod functionSelector={functionSelector} args={args} />
                {rawDataHex && <HexDataInfo rawDataHex={rawDataHex} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherTriggerSmartContractPage;
