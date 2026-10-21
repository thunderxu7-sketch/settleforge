import classNames from 'classnames';
import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import { isCustomToken } from '../../utils/token';
import { AssetItemType } from '../../../../../constants/types';

import styles from '../TransferStep2Page.m.scss';

import TokenCustomDefaultImg from '../images/token_custom_default.svg';
import Token10DefaultImage from '../images/token_10_default.svg';

interface Props {
  tokenStatus: string;
  tokenTips: string;
  selectedToken: AssetItemType;
  setShowTokenSelect: (isShow: boolean) => void;
}

const TokenInput: FC<Props> = ({ tokenStatus, tokenTips, selectedToken, setShowTokenSelect }) => {
  let { name, shortName, type, tokenStatus: status, logoUrl } = selectedToken;
  if (type === 0) {
    name = 'TRX';
    shortName = 'TRX';
  }
  const tokenImg = isCustomToken(status) ? TokenCustomDefaultImg : logoUrl || Token10DefaultImage;
  return (
    <div
      className={classNames(
        styles.tokenInput,
        tokenStatus === 'error'
          ? styles.error
          : tokenStatus === 'warn'
          ? styles.warn
          : tokenStatus === 'info'
          ? styles.info
          : '',
      )}
    >
      <p className={styles.title}>
        <FormattedMessage id="PAGES.TOKENS" />
      </p>
      <div
        className={styles.inputBox}
        onClick={() => {
          setShowTokenSelect(true);
        }}
      >
        <div className={styles.optionContent}>
          <div className={styles.tokenIcon}>
            <img
              src={tokenImg}
              onError={(e) => {
                (e.target as HTMLImageElement).src = Token10DefaultImage;
              }}
            />
          </div>
          <p className={styles.tokenName}>
            <span className={styles.abbr}>{shortName}</span>
            <span className={styles.completeName}>({name})</span>
          </p>

          <div className={styles.selectIcon}></div>
        </div>
      </div>
      {tokenTips && (
        <p className={styles.inputCriteria}>
          <i></i>
          <FormattedMessage id={tokenTips} />
        </p>
      )}
    </div>
  );
};

export default memo(TokenInput);
