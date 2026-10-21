import { useCallback, useEffect, useReducer } from 'react';
import { BigNumber } from 'bignumber.js';

import { callGetPendingWebsiteInfoService } from '../../../service/get_pending_website_info';
import { callApproveConnectWebsiteService } from '../../../service/approve_connect_website';
import { callRejectConnectWebsiteService } from '../../../service/reject_connect_website';
import { getSelectedNode } from '../../../store/slices/node_management';
import { useAddressInfo } from '../../../hooks/address_info';
import { msgNode } from '../../../popup/inst';
import Toast from '../../../components/Toast';
import { useAppSelector } from '../../../store/hooks';
import { selectCheckPendingInfos } from '../../../store/slices/notification';
import { resourceManager } from '../../../domain/resource_manager';
import { cutMiddle } from '../../../popup/utils';

interface State {
  hostname: string;
  websiteName: string;
  websiteIcon: string;
  name: string;
  address: string;
  amount: BigNumber | number;
}

const initialState: State = {
  hostname: '',
  websiteName: '',
  websiteIcon: '',
  name: '',
  address: '',
  amount: 0,
};

type Action = {
  type: 'INIT';
  payload: State;
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

export const useConnectWebsiteBiz = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const checkPendingInfos = useAppSelector(selectCheckPendingInfos);

  const { addressInfo } = useAddressInfo();
  const selectedNode = useAppSelector(getSelectedNode);

  useEffect(() => {
    (async () => {
      const pendingWebsiteInfo = await callGetPendingWebsiteInfoService(msgNode);
      await resourceManager.getResourceInfoFromStorage();

      const name = addressInfo.addressItems[addressInfo.selectedAddress].name;
      let formatName = name;
      if (name.length > 20) {
        formatName = cutMiddle(name, 10, 10);
      }
      const address = addressInfo.selectedAddress;
      const formatAddress = cutMiddle(address, 8, 8);

      // const addressData = _.get(resourceManager.resourceInfo, [address], {});
      // const followedAsset = _.get(addressData, 'followedAsset', []);
      const followedAsset = await resourceManager.getFollowedAssetList(address, selectedNode);
      const trxAsset = followedAsset.filter((asset: { type: number }) => Number(asset.type) === 0);
      const amount = new BigNumber(trxAsset[0]?.trxCount);

      dispatch({
        type: 'INIT',
        payload: {
          ...pendingWebsiteInfo,
          amount: amount,
          name: formatName,
          address: formatAddress,
        },
      });
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkPendingInfos]);

  const onConfirm = useCallback(async () => {
    Toast.show({
      icon: 'loading',
      duration: 0,
    });
    await callApproveConnectWebsiteService(msgNode);
    Toast.hide();
  }, []);

  const onCancel = useCallback(async () => {
    Toast.show({
      icon: 'loading',
      duration: 0,
    });
    await callRejectConnectWebsiteService(msgNode);
    Toast.hide();
  }, []);

  return {
    state,
    onConfirm,
    onCancel,
  };
};
