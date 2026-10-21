import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Drawer, Input } from 'antd';
import Icon from '@ant-design/icons';

import LazyImage from './LazyImage';
import { CollectionType } from '../../../../../constants/types';
import { SelectedCollectionType } from '../hook/collection';
import { generateSelectedText } from '../../utils/generateSelectedText';

import styles from '../TransferStep2Page.m.scss';

import Token721DefaultImg from '../images/token_721_default.svg';
import CloseSelect from '../images/icon-close-select.svg';
import SearchInput from '../images/icon-search-input.svg';
import SelectedCollection from '../images/icon-selected-token.svg';
import NoResult from '../images/icon-no-result.svg';

interface Props {
  showCollectionSelect: boolean;
  selectedCollection: SelectedCollectionType;
  allCollections: CollectionType[];
  searchCollectionKeyWords: string;
  hasGetAllCollection: boolean;

  setShowCollectionSelect: (isShow: boolean) => void;
  setSelectedCollection: (assetId: string) => void;
  setSearchCollectionKeyWords: (keyWords: string) => void;
  getNextPage: () => void;
}

const CollectionSelect: FC<Props> = ({
  showCollectionSelect,
  selectedCollection,
  allCollections,
  searchCollectionKeyWords,
  hasGetAllCollection,
  setShowCollectionSelect,
  setSelectedCollection,
  setSearchCollectionKeyWords,
  getNextPage,
}) => {
  const { formatMessage } = useIntl();
  const maxShowCollectionLength = 20;

  const handleOnScroll = (e: any) => {
    if (e.target.scrollHeight - e.target.scrollTop <= e.target.offsetHeight + 50) {
      searchCollectionKeyWords.length === 0 && getNextPage();
    }
  };

  return (
    <div className={styles.collectionSelect} id="collectionSelect">
      <Drawer
        title={formatMessage({ id: 'ACCOUNT.SEND.CHOOSE_COLLECTIBLES' })}
        height={520}
        placement={'bottom'}
        onClose={() => {
          setShowCollectionSelect(false);
        }}
        visible={showCollectionSelect}
        closeIcon={<img src={CloseSelect} alt="" />}
        getContainer={() => {
          return document.querySelector('#collectionSelect') ?? document.body;
        }}
      >
        <div className={styles.inputBox}>
          <Input
            value={searchCollectionKeyWords}
            size="large"
            allowClear
            placeholder={formatMessage({ id: 'ACCOUNT.SEND.COLLECTION_SELECT_PLACEHOLDER' })}
            prefix={<Icon component={() => <img src={SearchInput} alt="" />} />}
            onChange={(e) => {
              setSearchCollectionKeyWords(e.target.value);
            }}
          />
        </div>
        {allCollections.length > 0 ? (
          <div
            className={styles.collectionList}
            onScroll={(e) => {
              handleOnScroll(e);
            }}
          >
            {allCollections.map((collection, index) => {
              // only show first 20 collection when search by key words
              if (searchCollectionKeyWords.length > 0 && index >= 20) {
                return;
              }
              const { imageUrl, logoUrl, name, assetId } = collection;
              const token721Img = imageUrl || logoUrl || Token721DefaultImg;
              return (
                <div
                  key={assetId}
                  className={styles.collectionItem}
                  onClick={() => {
                    setSelectedCollection(assetId);
                    setShowCollectionSelect(false);
                  }}
                >
                  <div className={styles.collectionImg}>
                    <LazyImage defaultSrc={Token721DefaultImg} realSrc={token721Img} />
                  </div>
                  <div className={styles.bottomLine}>
                    <div className={styles.collectionInfo}>
                      <div className={styles.collectionName}>
                        {generateSelectedText(name || `# ${assetId}`, searchCollectionKeyWords)}
                      </div>
                      {name && (
                        <div className={styles.collectionId}>
                          {'# '}
                          {generateSelectedText(assetId, searchCollectionKeyWords)}
                        </div>
                      )}
                    </div>
                    {selectedCollection && selectedCollection.assetId === assetId && (
                      <div className={styles.selectedIcon}>
                        <img src={SelectedCollection} alt="" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {searchCollectionKeyWords &&
              searchCollectionKeyWords.length > maxShowCollectionLength &&
              allCollections.length >= 0 && (
                <div className={styles.bottomTips}>
                  <FormattedMessage
                    id="TRANSFER.STEP_2.SEARCH_TOKEN_TIPS"
                    values={{
                      span: (value: any) => <span>{value}</span>,
                      br: () => <br />,
                      searchAmount: maxShowCollectionLength,
                    }}
                  />
                </div>
              )}

            {hasGetAllCollection && (
              <div className={styles.noMore}>
                <FormattedMessage id="TRANSFER.STEP_2.NO_MORE_COLLECTION" />
              </div>
            )}
          </div>
        ) : (
          <div className={styles.noResult}>
            <img src={NoResult} alt="" />
            <div className={styles.desc}>
              <FormattedMessage id="ACCOUNT.SEND.NO_SEARCH_COLLECTION" />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default memo(CollectionSelect);
