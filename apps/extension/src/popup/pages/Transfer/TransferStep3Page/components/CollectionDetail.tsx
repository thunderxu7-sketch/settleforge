import { FC, memo, ChangeEvent } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from '../TransferStep3Page.m.scss';

import TransferCollection from '../images/icon-transfer-collection.svg';
import Token721DefaultImage from '../images/token_721_default.svg';
import Token10DefaultImage from '../images/token_10_default.svg';

interface Props {
  tokenImg: string;
  shortName: string;
  collectionImg: string;
  assetId: number | string;
  collectionName: string;
}
const CollectionDetail: FC<Props> = ({
  tokenImg,
  shortName,
  collectionImg,
  assetId,
  collectionName,
}) => {
  return (
    <div className={styles.collectionDetail}>
      <div className={styles.transferImg}>
        <img src={TransferCollection} alt="" />
        <img
          src={collectionImg}
          onError={(e: ChangeEvent<HTMLImageElement>) => {
            e.target.src = Token721DefaultImage;
          }}
          alt=""
        />
      </div>
      <h1 className={styles.title}>
        <FormattedMessage id="ACCOUNT.TYPE.SEND_COLLECTION" />
      </h1>
      <p className={styles.assetInfo}>
        {`#${assetId}`}
        {collectionName && `(${collectionName})`}
      </p>
      <div className={styles.tokenInfo}>
        <img
          src={tokenImg}
          onError={(e: ChangeEvent<HTMLImageElement>) => {
            e.target.src = Token10DefaultImage;
          }}
          alt=""
        />
        <span>{shortName}</span>
      </div>
    </div>
  );
};

export default memo(CollectionDetail);
