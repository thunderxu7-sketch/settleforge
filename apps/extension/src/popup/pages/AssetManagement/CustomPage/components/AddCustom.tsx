import { FC, memo } from 'react';
import classNames from 'classnames';
import { useNavigate } from 'react-router';
import { useIntl, FormattedMessage } from 'react-intl';
import { usePricesInfo } from '../../../../../hooks/prices_info';

import { newTokenAmountAndWorth } from '../../../../utils/newTokenAmountAndWorth';
import { formatNumber, BigNumber } from '../../../../utils/numberUtils';
import { filterTronLinkNoFunctions } from '../../../../utils/assetUtils';
import { NOT_SUPPORT_MAPPER } from '../../../../../constants/common';
import { CustomTokenInfoType } from '../../../../../constants/types';

import styles from '../CustomPage.m.scss';
import TokenCustomDefaultImg from '../../../../../static/images/token_custom_default.svg';

interface Props {
  customTokenInfo: CustomTokenInfoType;
  inputAbbr: string;
  inputName: string;
  toStep: (step: number, contractAddress: string | undefined) => void;
  addToken: () => void;
}

const AddCustom: FC<Props> = ({ customTokenInfo, toStep, addToken, inputAbbr, inputName }) => {
  const {
    totalSupply,
    type,
    decimal,
    contractAddress,
    logoUrl,
    price,
    noFunctions,
    usdCount,
    cnyCount,
  } = customTokenInfo;
  const { formatMessage } = useIntl();
  const navigator = useNavigate();
  const { pricesInfo } = usePricesInfo();
  const { moneyStr } = newTokenAmountAndWorth(
    price,
    new BigNumber(totalSupply).div(Math.pow(10, decimal)),
    pricesInfo,
    usdCount,
    cnyCount,
  );
  const filterNoFunctions = filterTronLinkNoFunctions(noFunctions, type);

  return (
    <div className={classNames(styles.customToken, styles.scroll)}>
      <div className={styles.addTip}>
        <FormattedMessage id="ASSET.CUSTOM.TIP.SOON_ADD" />
      </div>

      <div className={styles.tokenInfo}>
        <img src={logoUrl || TokenCustomDefaultImg} alt="" />
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <div className={styles.name}>{inputAbbr}</div>
            <div className={styles.fullName}>{`(${inputName})`}</div>
            <div className={styles.type}>{type == 2 ? 'TRC20' : 'TRC721'}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.balance}>
              {formatNumber(new BigNumber(totalSupply).div(Math.pow(10, decimal)), { dp: 0 })}
            </div>
            <div className={styles.balanceUsd}>{`(${formatNumber(moneyStr, { dp: 4 })})`}</div>
          </div>
          <div className={styles.address}>{contractAddress}</div>
        </div>
      </div>

      {filterNoFunctions.length > 0 && (
        <>
          <div className={styles.tip}>
            <FormattedMessage id="ASSET.CUSTOM.WARN.PROBLEMS" />
          </div>

          {filterNoFunctions.map((functionId: string) => {
            return (
              <div className={styles.tipContent} key={functionId}>
                <span>{'!'}</span>
                <FormattedMessage id={NOT_SUPPORT_MAPPER[functionId]} />
              </div>
            );
          })}
        </>
      )}

      <div className={styles.fixBottom}>
        <div className={styles.confirm} onClick={() => addToken()}>
          {formatMessage({ id: 'BUTTON.CONFIRM2' })}
        </div>
        <div className={styles.cancel} onClick={() => navigator(-1)}>
          {formatMessage({ id: 'BUTTON.CANCEL' })}
        </div>
      </div>
    </div>
  );
};

export default memo(AddCustom);
