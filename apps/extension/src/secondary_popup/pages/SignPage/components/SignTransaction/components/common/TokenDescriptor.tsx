import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { isCustomToken } from '../../../../utils';

import token10DefaultImg from '../../../../../../../static/images/token_10_default.svg';
import iconVerify from '../../../../../../../static/images/icon-verify.svg';
import tokenCustomDefaultImg from '../../../../../../../static/images/token_custom_default.svg';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  functionLogo: string;
  functionFormatObj: {
    type: 'intl' | 'plain';
    id: string;
  };
  tokenLogo: string;
  tokenInfo: any;
}
const TokenDescriptor: FC<Props> = ({
  functionLogo,
  tokenLogo,
  functionFormatObj = {},
  tokenInfo,
}) => {
  const { type, isOfficial, isRisk, tokenStatus, assetLogo } = tokenInfo || {};
  const isTrc721 = Number(type) === 5;
  const isCustom = isCustomToken(tokenStatus);
  const intl = useIntl();
  const functionText =
    functionFormatObj?.type === 'intl'
      ? intl.formatMessage({ id: functionFormatObj?.id })
      : functionFormatObj?.id;
  return (
    <div className={styles.tokenDes}>
      <div className={styles.logo}>
        {functionLogo && <img src={functionLogo} alt="" />}
        {tokenInfo && (
          <div>
            {isTrc721 ? (
              <div className={styles.tokenLogo}>
                <img
                  src={assetLogo || token10DefaultImg}
                  alt=""
                  onError={(e) => {
                    e.target.src = token10DefaultImg;
                  }}
                />
              </div>
            ) : (
              <div className={styles.tokenLogo}>
                <img
                  src={isCustom ? tokenCustomDefaultImg : tokenLogo || token10DefaultImg}
                  alt=""
                  onError={(e) => {
                    e.target.src = token10DefaultImg;
                  }}
                />
                {Number(isOfficial) === 1 && <img src={iconVerify} alt="" />}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={styles.desText}>{functionText}</div>
      {isRisk && (
        <div className={styles.riskTips}>
          <i></i>
          <FormattedMessage id={'ASSET.ASSET_MANAGE.RISK_TOKEN.TIP'} />
        </div>
      )}
    </div>
  );
};

export default TokenDescriptor;
