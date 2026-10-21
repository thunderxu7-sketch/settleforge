import { FC, memo } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tabs } from 'antd';

import { AddressBookState } from '../../../../../store/slices/address_book';

import TransferItem from './TransferItem';

import styles from '../TokenTransferListPage.m.scss';

import noRecord from '../images/icon-no-record.svg';

const { TabPane } = Tabs;

interface Props {
  precision: number;
  transactions: any;
  selectedAddress: string;
  addressBook: AddressBookState;
  isLoadingTransaction: boolean;
  setCurrentTab: (tabIndex: number) => void;
  navigateToTransferDetail: (txId: string, record:any) => void;
  getNextPageTransactions: () => void;
}

const TransferList: FC<Props> = ({
  precision,
  transactions,
  selectedAddress,
  addressBook,
  isLoadingTransaction,
  setCurrentTab,
  navigateToTransferDetail,
  getNextPageTransactions,
}) => {
  const { formatMessage } = useIntl();
  const nameList = [
    formatMessage({ id: 'ACCOUNT.ALL' }),
    formatMessage({ id: 'ACCOUNT.TYPE.SENT' }),
    formatMessage({ id: 'ACCOUNT.TYPE.RECEIVED' }),
  ];

  const handleOnScroll = (e: any) => {
    if (e.target.scrollHeight - e.target.scrollTop <= e.target.offsetHeight + 50) {
      getNextPageTransactions();
    }
  };

  return (
    <div className={classNames(styles.transferList)}>
      <Tabs
        defaultActiveKey="0"
        onChange={(activeKey) => {
          setCurrentTab(parseInt(activeKey));
        }}
      >
        {nameList.map((tabName, index) => (
          <TabPane tab={tabName} key={index}>
            {transactions && transactions.length > 0 ? (
              <div
                className={styles.scroll}
                onScroll={(e) => {
                  handleOnScroll(e);
                }}
              >
                {transactions.map((record: any, transIndex: number) => (
                  <TransferItem
                    key={transIndex}
                    precision={precision}
                    selectedAddress={selectedAddress}
                    addressBook={addressBook}
                    record={record}
                    navigateToTransferDetail={navigateToTransferDetail}
                  />
                ))}
              </div>
            ) : !isLoadingTransaction ? (
              <div className={styles.noRecord}>
                <img src={noRecord} />
                <p>
                  <FormattedMessage id="ACCOUNT.SEND.EMPTY_ADDRESS_COLLECTION" />
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

export default memo(TransferList);
