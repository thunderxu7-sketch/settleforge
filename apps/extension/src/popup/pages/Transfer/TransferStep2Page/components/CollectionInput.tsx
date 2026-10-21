import classNames from 'classnames';
import { ChangeEvent, FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import { isCustomToken } from '../../utils/token';
import { AssetItemType } from '../../../../../constants/types';
import { SelectedCollectionType } from '../hook/collection';

import styles from '../TransferStep2Page.m.scss';

import TokenCustomDefaultImg from '../images/token_custom_default.svg';
import Token721DefaultImg from '../images/token_721_default.svg';

interface Props {
  selectedToken: AssetItemType;
  selectedCollection: SelectedCollectionType;

  setShowCollectionSelect: (isShow: boolean) => void;
}

const CollectionInput: FC<Props> = ({
  selectedToken,
  selectedCollection,
  setShowCollectionSelect,
}) => {
  const { imageUrl, logoUrl, name, assetId } = selectedCollection ?? {};
  const collectionImg = imageUrl || logoUrl || Token721DefaultImg;

  return (
    <div className={styles.collectionInput}>
      <p className={styles.title}>
        <FormattedMessage id="ASSET.COLLECTION" />
      </p>
      {selectedCollection && Object.keys(selectedCollection).length > 0 ? (
        <div
          className={styles.inputBox}
          onClick={() => {
            setShowCollectionSelect(true);
          }}
        >
          <div className={styles.collectionImg}>
            <img
              src={collectionImg}
              onError={(e: ChangeEvent<HTMLImageElement>) => {
                e.target.src = Token721DefaultImg;
              }}
              alt=""
            />
          </div>
          <p className={styles.collectionName}>
            {name ? (
              <>
                {name}
                <span>(# {assetId})</span>
              </>
            ) : (
              `# ${assetId}`
            )}
          </p>
          <i className={styles.collectionDrop}></i>
        </div>
      ) : (
        <div className={styles.inputBox}>
          <div className={styles.collectionImg}>
            <img
              src={collectionImg}
              onError={(e: ChangeEvent<HTMLImageElement>) => {
                e.target.src = Token721DefaultImg;
              }}
              alt=""
            />
          </div>
          <p className={classNames(styles.collectionName, styles.empty)}>
            <FormattedMessage id="ACCOUNT.SEND.NO_COLLECTION" />
          </p>
        </div>
      )}
    </div>
  );
};

export default memo(CollectionInput);
