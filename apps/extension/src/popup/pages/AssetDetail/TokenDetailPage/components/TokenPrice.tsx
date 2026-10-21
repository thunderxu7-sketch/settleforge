import { FC, memo } from 'react';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { BigNumber } from '../../../../utils/numberUtils';

import styles from '../TokenDetailPage.m.scss';

import TokenDefault from '../images/token_10_default.svg';
import TokenCustom from '../images/token_custom_default.svg';

interface Props {
  name: string;
  shortName: string;
  type: number;
  logoUrl: string;
  price: number;
  tokenStatus: number;
}
const TokenPrice: FC<Props> = ({ name, shortName, type, logoUrl, price, tokenStatus }) => {
  const transferImg =
    tokenStatus === 1 || tokenStatus === 2 ? TokenCustom : logoUrl || TokenDefault;

  const formatPrice = new BigNumber(_.floor(price, 3));
  let formatPriceStr = formatPrice.toFormat();
  if (formatPrice.lt(0.001)) {
    formatPriceStr = `< 0.001`;
  }

  return (
    <div className={styles.tokenPrice}>
      <div className={styles.tokenImg}>
        <img
          src={transferImg}
          onError={(e) => {
            e.target.src = TokenDefault;
          }}
        />
      </div>
      <div>
        <p className={styles.transferTypeName}>
          <span className={styles.shortName}>{shortName}</span>
          <span className={styles.name}>({name})</span>
          <span
            className={classNames(
              styles.type,
              type === 5 ? styles.trc721 : type === 2 ? styles.trc20 : styles.trc10,
            )}
          >
            {type === 5 ? 'TRC721' : type === 2 ? 'TRC20' : 'TRC10'}
          </span>
        </p>
        {price ? (
          <p className={styles.price}>
            <FormattedMessage id="ASSET.COLLECTION.PRICE.LASTST" />
            :&nbsp;{formatPriceStr} TRX
          </p>
        ) : (
          <FormattedMessage id="ASSET.COLLECTION.PRICE.DEFAULT" />
        )}
      </div>
    </div>
  );
};

export default memo(TokenPrice);
