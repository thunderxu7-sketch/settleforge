// @ts-ignore
import { FC } from 'react';
import classNames from 'classnames';

import TabMenu from '../../../TabMenu';
import TokenDescriptor from '../common/TokenDescriptor';
import AmountInfo from '../common/AmountInfo';
import FromToInfo from '../common/FromToInfo';
import FeeMeta from '../MetaData/Fee';
import NoteMeta from '../MetaData/Note';
import ResourceMeta from '../MetaData/Resource';
import HexDataInfo from '../HexDataInfo';

import iconTransfer from '../../../../static/images/icon-transfer.svg';
import tokenLogo from '../../../../../../../static/images/trx.png';

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
const TransferContractPage: FC<Props> = ({
  tabIndex,
  changeTab,
  contractType,
  confirmation,
  paramsInfo,
  costs,
}) => {
  const {
    fromAddress,
    toAddress,
    amount,
    fromAddressName,
    toAddressName,
    unit,
    decimal,
    rawDataHex,
    tokenInfo,
  } = paramsInfo;

  return (
    <div className={classNames(styles.signContent, 'col', 'scroll')}>
      <TokenDescriptor
        functionLogo={iconTransfer}
        tokenLogo={tokenLogo}
        functionFormatObj={{
          type: 'intl',
          id: 'CONFIRMATIONS.NEW.FUNCTION.TRANSFER',
        }}
        tokenInfo={tokenInfo}
      />
      <AmountInfo amount={amount} unit={unit} decimal={decimal}></AmountInfo>
      <div className={classNames(styles.transferDetail, 'scroll', 'col')}>
        <TabMenu tabIndex={tabIndex} changeTab={changeTab} />
        <div className={classNames(styles.transferTabDetail, 'scroll')}>
          {tabIndex === 0 && (
            <div className={classNames(styles.tradeDetail, 'scroll')}>
              <FromToInfo
                fromAddress={fromAddress}
                toAddress={toAddress}
                fromAddressName={fromAddressName}
                toAddressName={toAddressName}
              />
              <div className={styles.metaDataWrap}>
                <NoteMeta comfirmation={confirmation} />
                <FeeMeta costs={costs} />
                <ResourceMeta costs={costs} />
              </div>
            </div>
          )}
          {tabIndex === 1 && (
            <div className={classNames(styles.tradeData, 'scroll')}>
              {rawDataHex && <HexDataInfo rawDataHex={rawDataHex} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferContractPage;
