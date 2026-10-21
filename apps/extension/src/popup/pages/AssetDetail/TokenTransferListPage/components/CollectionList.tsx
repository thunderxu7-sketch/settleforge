import { FC, memo } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tabs } from 'antd';

import CollectionItem from './CollectionItem';
import CollectionTransferItem from './CollectionTransferItem';
import { CollectionType } from '../../../../../constants/types';

import styles from '../TokenTransferListPage.m.scss';

import noCollection from '../images/icon-no-collection.svg';
import noRecord from '../images/icon-no-record.svg';

const { TabPane } = Tabs;

interface Props {
  selectedAddress: string;
  collections: CollectionType[];
  collectionTransactions: any[];
  isLoadingCollection: boolean;

  setCollectionCurrentTab: (tabIndex: number) => void;
  navigateToCollectionDetail: (tabIndex: string) => void;
  navigateToTransferDetail: (txId: string, record: any) => void;
  getNextPageCollection: () => void;
  getNextPageCollectionTransaction: () => void;
}

const CollectionList: FC<Props> = ({
  selectedAddress,
  collections,
  collectionTransactions,
  isLoadingCollection,
  setCollectionCurrentTab,
  navigateToCollectionDetail,
  navigateToTransferDetail,
  getNextPageCollection,
  getNextPageCollectionTransaction,
}) => {
  const { formatMessage } = useIntl();

  const dataList = [
    { name: formatMessage({ id: 'ASSET.COLLECTION.LIST' }), type: 'collection', data: collections },
    {
      name: formatMessage({ id: 'ASSET.COLLECTION.TRANSACTION' }),
      type: 'transfer',
      data: collectionTransactions,
    },
  ];

  const handleOnScroll = (e: any, type: string) => {
    if (e.target.scrollHeight - e.target.scrollTop <= e.target.offsetHeight + 50) {
      if (type === 'collection') {
        getNextPageCollection();
      } else {
        getNextPageCollectionTransaction();
      }
    }
  };

  return (
    <div className={classNames(styles.collectionList)}>
      <Tabs
        defaultActiveKey="0"
        onChange={(activeKey) => {
          setCollectionCurrentTab(parseInt(activeKey));
        }}
      >
        {dataList.map(({ name, type, data }, index) => (
          <TabPane tab={name} key={index}>
            {data && data.length > 0 ? (
              <div
                className={styles.scroll}
                onScroll={(e) => {
                  handleOnScroll(e, type);
                }}
              >
                {data.map((item: CollectionType, index: number) =>
                  type === 'collection' ? (
                    <CollectionItem
                      item={item}
                      key={index}
                      navigateToCollectionDetail={navigateToCollectionDetail}
                    />
                  ) : (
                    <CollectionTransferItem
                      item={item}
                      key={index}
                      selectedAddress={selectedAddress}
                      navigateToTransferDetail={navigateToTransferDetail}
                    />
                  ),
                )}
              </div>
            ) : !isLoadingCollection ? (
              <div className={styles.noRecord}>
                <img src={type === 'collection' ? noCollection : noRecord} />
                <p>
                  <FormattedMessage
                    id={
                      type === 'collection'
                        ? 'ASSET.SEARCH.COLLECTIBLES.NOT_FIND'
                        : 'ACCOUNT.SEND.EMPTY_ADDRESS_COLLECTION'
                    }
                  />
                </p>
              </div>
            ) : (
              ''
            )}
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default memo(CollectionList);
