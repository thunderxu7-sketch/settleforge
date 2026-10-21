// @ts-ignore
import { FC } from 'react';
// import BigNumber from 'bignumber.js';
import classNames from 'classnames';
import _ from 'lodash';

import TabMenu from '../../../TabMenu';
import TokenDescriptor from '../common/TokenDescriptor';
import AmountInfo from '../common/AmountInfo';
import FromToInfo from '../common/FromToInfo';
import FeeMeta from '../MetaData/Fee';
import NoteMeta from '../MetaData/Note';
import TokenIDMeta from '../MetaData/TokenIDMeta';
import ResourceMeta from '../MetaData/Resource';
import HexDataInfo from '../HexDataInfo';
import { BigNumber } from '../../../../../../../popup/utils/numberUtils';

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
const TransferAssetContractPage: FC<Props> = ({
  tabIndex,
  changeTab,
  contractType,
  confirmation,
  paramsInfo,
  costs,
}) => {
  const { fromAddress, toAddress, amount, fromAddressName, toAddressName, tokenInfo, rawDataHex } =
    paramsInfo;
  const decimal = _.get(tokenInfo, 'precision', 0);
  const amountFormat = new BigNumber(amount).shiftedBy(-decimal);
  const unit = _.get(tokenInfo, 'shortName', '');

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
      {tokenInfo && <AmountInfo amount={amountFormat} unit={unit} decimal={decimal}></AmountInfo>}
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
                <TokenIDMeta tokenID={paramsInfo?.tokenId} />
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

export default TransferAssetContractPage;
