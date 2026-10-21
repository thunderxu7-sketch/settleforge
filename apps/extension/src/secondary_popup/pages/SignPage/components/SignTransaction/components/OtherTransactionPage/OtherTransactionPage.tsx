// @ts-ignore
import { FC } from 'react';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import classNames from 'classnames';

import TabMenu from '../../../TabMenu';
import TokenDescriptor from './TokenDescriptor';
import RiskTokenTip from '../common/RiskTokenTip';
import FeeMeta from '../MetaData/Fee';
import NoteMeta from '../MetaData/Note';
import ResourceMeta from '../MetaData/Resource';
import HexDataInfo from '../HexDataInfo';

import iconContract from '../../../../static/images/icon-contract.svg';
import iconMessage from '../../../../static/images/icon-message.svg';

import { ParamsInfoType, CostsType } from '../../../hooks';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  tabIndex: number;
  changeTab: (tabIndex: number) => void;
  contractType: string;
  confirmation: ConfirmationObj;
  paramsInfo: ParamsInfoType;
  costs: CostsType;
}
const OtherTransactionPage: FC<Props> = ({
  tabIndex,
  changeTab,
  contractType,
  confirmation,
  paramsInfo,
  costs,
}) => {
  const { rawDataHex, isRisk } = paramsInfo;
  const { formatMessage } = useIntl();
  let functionLogo;
  let functionText;
  if (_.size(confirmation?.input) > 0) {
    functionLogo = contractType ? iconContract : iconMessage;
    functionText = formatMessage({
      id: `CONTRACTS.${contractType ? contractType : 'MessageSignature'}`,
    });
  }
  return (
    <div className={classNames(styles.signContent, 'col', 'scroll')}>
      <TokenDescriptor functionLogo={functionLogo} functionText={functionText} />
      {isRisk && <RiskTokenTip />}
      <div className={classNames(styles.transferDetail, 'scroll', 'col')}>
        <TabMenu tabIndex={tabIndex} changeTab={changeTab} />
        <div className={classNames(styles.transferTabDetail, 'scroll')}>
          {tabIndex === 0 && (
            <div className={classNames(styles.tradeDetail, 'scroll')}>
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

export default OtherTransactionPage;
