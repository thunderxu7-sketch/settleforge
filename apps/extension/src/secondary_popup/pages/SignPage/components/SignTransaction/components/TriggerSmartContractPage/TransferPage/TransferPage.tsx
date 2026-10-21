import { FC } from 'react';
// import BigNumber from 'bignumber.js';
import _ from 'lodash';
import classNames from 'classnames';

import { BigNumber } from '../../../../../../../../popup/utils/numberUtils';
import TabMenu from '../../../../TabMenu';
import TokenDescriptor from '../../common/TokenDescriptor';
import FromToInfo from '../../common/FromToInfo';
import AmountInfo from '../../common/AmountInfo';
import AmountInfo721 from '../../common/AmountInfo721';
import ContractCalledMeta from '../../MetaData/ContractCalled';
import FeeMeta from '../../MetaData/Fee';
import NoteMeta from '../../MetaData/Note';
import ResourceMeta from '../../MetaData/Resource';
import HexDataInfo from '../../HexDataInfo';
import ContractMethod from '../../common/ContractMethod';

import { ParamsInfoType, CostsType } from '../../../../../hooks';

import styles from '../../../../../static/scss/common.m.scss';
import { ConfirmationObj } from '../../../../../../../../domain/sign_manager';

import iconTransfer from '../../../../../static/images/icon-transfer.svg';
interface Props {
  tabIndex: number;
  changeTab: (tabIndex: number) => void;
  paramsInfo: ParamsInfoType;
  costs: CostsType;
  confirmation: ConfirmationObj;
}
const TransferPage: FC<Props> = ({ tabIndex, changeTab, paramsInfo, costs, confirmation }) => {
  const {
    fromAddress,
    toAddress,
    fromAddressName,
    toAddressName,
    amount,
    rawDataHex,
    contractAddress,
    tokenInfo,
    args,
  } = paramsInfo;
  const functionSelector = confirmation?.input?.function_selector;
  const shortName = tokenInfo?.shortName || tokenInfo?.name;

  const decimal = _.get(tokenInfo, 'precision', 0);
  const amoutFormat = new BigNumber(amount).shiftedBy(-decimal);
  const { assetName = '', assetLogo = '', type = '', logoUrl = '' } = tokenInfo || {};
  let tokenLogo = logoUrl;
  if (Number(type === 5)) {
    tokenLogo = assetLogo;
  }
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
      {tokenInfo &&
        (tokenInfo?.type === 5 ? (
          <AmountInfo721 amount={amoutFormat} unit={shortName} tokenInfo={tokenInfo} />
        ) : (
          <AmountInfo amount={amoutFormat} unit={shortName} decimal={decimal} />
        ))}
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

export default TransferPage;
