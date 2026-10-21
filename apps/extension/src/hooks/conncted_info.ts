import { useEffect, useState } from 'react';
import _ from 'lodash';

import { useAppSelector } from '../store/hooks';
import {
  ConnectedWebsiteType,
  selectConnectedWebsiteInfo,
} from '../store/slices/connected_website';
import { selectAddressInfo } from '../store/slices/address_info';
import { sysWhiteList } from '../domain/request_accounts_manager';
import { getCurrentActiveTabInfo, TabInfoType } from '../lib/extension/tab';

export interface ConnectedAccountType {
  name: string;
  address: string;
  isCurrent: boolean;
  isConnected: boolean;
  webInfo?: ConnectedWebsiteType;
}

export const useConnectedInfo = () => {
  const addressInfo = useAppSelector(selectAddressInfo);
  const connectedWebsiteInfo = useAppSelector(selectConnectedWebsiteInfo);

  const [tabInfo, setTabInfo] = useState<TabInfoType | undefined>(undefined);
  const [isSysWhiteWebSite, setSysWhiteWebSite] = useState<boolean>(false);
  const [isConnected, setConnected] = useState<boolean>(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccountType[]>([]);
  const [connectedCount, setConnectedCount] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const tabInfo = await getCurrentActiveTabInfo();
      const { origin } = tabInfo;
      const selectedAddress = addressInfo.selectedAddress;
      const addressItems = addressInfo.addressItems;
      const connectedWebsites = connectedWebsiteInfo[selectedAddress] || [];
      const isSysWhiteWebSite = _.findIndex(sysWhiteList, (ele) => ele.origin === origin) > -1;
      const isConnected =
        _.findIndex(connectedWebsites, (ele) => ele.origin == origin) > -1 || isSysWhiteWebSite;
      let connectedCount = 0;
      if (isConnected) {
        connectedCount++;
      }
      const connectedAccounts: ConnectedAccountType[] = [];
      connectedAccounts.push({
        name: addressItems[selectedAddress].name,
        address: selectedAddress,
        isCurrent: true,
        isConnected: isConnected,
      });

      for (const addressItem of Object.values(addressItems)) {
        const connectedWebsites = connectedWebsiteInfo[addressItem.address] || [];
        const webInfo = connectedWebsites.find((ele) => ele.origin == origin);

        if (addressItem.address == selectedAddress) {
          connectedAccounts[0].webInfo = webInfo;
          continue;
        }
        if (isSysWhiteWebSite || webInfo) {
          connectedAccounts.push({
            name: addressItem.name,
            address: addressItem.address,
            isCurrent: false,
            isConnected: true,
            webInfo: webInfo,
          });
          connectedCount++;
        }
      }

      setTabInfo(tabInfo);
      setSysWhiteWebSite(isSysWhiteWebSite);
      setConnected(isConnected);
      setConnectedCount(connectedCount);
      setConnectedAccounts(connectedAccounts);
    })();
  }, [addressInfo, connectedWebsiteInfo]);

  return {
    tabInfo,
    isSysWhiteWebSite,
    isConnected,
    connectedCount,
    connectedAccounts,
  };
};
