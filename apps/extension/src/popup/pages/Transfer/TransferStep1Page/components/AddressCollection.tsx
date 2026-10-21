import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tabs } from 'antd';

import { Address } from '../hook';
import { TransferRecordItemState } from '../../../../../store/slices/transfer_record';
import AddressCollectionItem from './AddressCollectionItem';

import styles from '../TransferStep1Page.m.scss';

import EmptyCollection from '../images/icon-empty-address.svg';

const { TabPane } = Tabs;

interface Props {
  myAccounts: { [k: string]: Address };
  addressBooks: { [k: string]: Address };
  recentRecord: TransferRecordItemState[];
  activeTab: string;

  setShowAddress: (value: string) => void;
  changeActiveTab: (value: string) => void;
}

const AddressCollection: FC<Props> = ({
  myAccounts,
  addressBooks,
  recentRecord,
  activeTab,

  setShowAddress,
  changeActiveTab,
}) => {
  const { formatMessage } = useIntl();
  const recentAddress = recentRecord.map((item) => {
    const { toAddress: address, timestamp } = item;
    let name = address;
    let showAddress = address;

    if (myAccounts[address]) {
      name = myAccounts[address].name;
      showAddress = myAccounts[address].showAddress;
    }

    if (addressBooks[address]) {
      name = addressBooks[address].name;
      showAddress = addressBooks[address].showAddress;
    }

    return {
      name,
      address,
      showAddress,
      timestamp,
    };
  });

  const dataList = [
    {
      tabName: formatMessage({ id: 'ACCOUNT.SEND.RECENT_ADDRESS' }),
      addressData: recentAddress,
    },
    {
      tabName: formatMessage({ id: 'SETTING.TITLE.ADDRESS_BOOK' }),
      addressData: Object.values(addressBooks),
    },
    {
      tabName: formatMessage({ id: 'ACCOUNT.SEND.MY_ACCOUNT' }),
      addressData: Object.values(myAccounts),
    },
  ];

  return (
    <div className={styles.addressCollection}>
      <Tabs defaultActiveKey={activeTab} onChange={changeActiveTab}>
        {dataList.map((data, index) => {
          return (
            <TabPane tab={data.tabName} key={index}>
              {data.addressData && data.addressData.length > 0 ? (
                data.addressData.map((item: Address) => (
                  <AddressCollectionItem
                    key={item.showAddress}
                    data={item}
                    nameIndex={0}
                    addressIndex={0}
                    searchKey=""
                    setShowAddress={setShowAddress}
                  />
                ))
              ) : (
                <div className={styles.emptyList}>
                  <img src={EmptyCollection} alt="" />
                  <p>
                    <FormattedMessage
                      id={
                        activeTab === '0'
                          ? 'ACCOUNT.SEND.EMPTY_ADDRESS_COLLECTION'
                          : activeTab === '1'
                          ? 'ACCOUNT.SEND.EMPTY_ADDRESS_BOOK'
                          : 'ACCOUNT.SEND.EMPTY_MY_ACCOUNT'
                      }
                    />
                  </p>
                </div>
              )}
            </TabPane>
          );
        })}
      </Tabs>
    </div>
  );
};

export default memo(AddressCollection);
