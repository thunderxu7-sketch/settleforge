import { FC, memo } from 'react';
import _ from 'lodash';

import { cutMiddle } from '../../../../utils';
import { CollectionType } from '../../../../../constants/types';
import Image from '../../../../../components/Image';

import styles from '../TokenTransferListPage.m.scss';

import collectionDefault from '../images/token_721_default.svg';

interface Props {
  item: CollectionType;

  navigateToCollectionDetail: (assetId: string) => void;
}

const CollectionItem: FC<Props> = ({ item, navigateToCollectionDetail }) => {
  const { assetId, logoUrl, imageUrl, name } = item;

  const imgUrl = imageUrl || logoUrl || collectionDefault;

  return (
    <div
      className={styles.collectionItem}
      onClick={() => {
        navigateToCollectionDetail(assetId);
      }}
    >
      <Image defaultSrc={collectionDefault} src={imgUrl} />
      <div className={styles.info}>
        <p className={styles.name}>{formatTrc721AssetFiled(name)}</p>
        <p className={styles.assetId}>#{formatTrc721AssetFiled(assetId)}</p>
      </div>
      <i></i>
    </div>
  );
};

export default memo(CollectionItem);

function formatTrc721AssetFiled(elem: string, splitLen = 5) {
  return typeof elem === 'string' && _.size(elem) > splitLen * 2
    ? cutMiddle(elem, splitLen, splitLen)
    : elem;
}
