import _ from 'lodash';
import log from 'loglevel';

import { resourceManager } from '../../../../domain/resource_manager';
import { checkIsRiskToken, searchTokens } from './../../../../service/local_data_service';
import { FRONT_API_TIME_OUT } from '../../../../constants/api';
import { AllLocalTokensType, AssetType, AssetItemType } from './../../../../constants/types';

import Toast from '../../../../components/Toast';

export const getAllLocalTokens = async (
  selectedAddress: string,
  selectedNode: string,
): Promise<AssetType> => {
  try {
    await resourceManager.getResourceInfoFromStorage();

    const {
      followedAsset = [],
      followedCollection = [],
      unFollowedAsset = [],
      unFollowedCollection = [],
      newAsset = [],
      newCollection = [],
    }: AllLocalTokensType = await resourceManager.getAllAssetList(selectedAddress, selectedNode);

    return [
      ...followedAsset,
      ...followedCollection,
      ...unFollowedAsset,
      ...unFollowedCollection,
      ...newAsset,
      ...newCollection,
    ];
  } catch (error) {
    log.info('getAllLocalTokens error: ', error);
    return [];
  }
};

export const getTokenById = async (
  tokenId: string,
  selectedNode: string,
  selectedAddress: string,
  formatMessage: any,
) => {
  try {
    await resourceManager.getResourceInfoFromStorage();

    const {
      followedAsset = [],
      followedCollection = [],
      unFollowedAsset = [],
      unFollowedCollection = [],
      newAsset = [],
      newCollection = [],
    }: AllLocalTokensType = await resourceManager.getAllAssetList(selectedAddress, selectedNode);

    let selectedToken = [
      ...followedAsset,
      ...followedCollection,
      ...unFollowedAsset,
      ...unFollowedCollection,
      ...newAsset,
      ...newCollection,
    ].find((token) => {
      return isSelectedToken(tokenId, token);
    });

    if (selectedToken) {
      return selectedToken;
    }

    Toast.show({ icon: 'loading' });
    const { success, data, error } = await searchTokens(selectedAddress, tokenId);
    if (success && data && data.token) {
      return data.token[0];
    }

    error && error.indexOf(FRONT_API_TIME_OUT) !== -1
      ? Toast.show({
          icon: 'fail',
          content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
          duration: 3000,
        })
      : Toast.hide();

    return {};
  } catch (error) {
    log.info('getTokenById error: ', error);
  }
};

export const isSelectedToken = (tokenId: string, selectedToken: AssetItemType): boolean => {
  try {
    const { type, id, contractAddress } = selectedToken;

    if (type === 1) {
      return tokenId === id;
    } else if (type === 2 || type === 5) {
      return tokenId === contractAddress;
    } else {
      return tokenId === '';
    }
  } catch (error) {
    log.info('isSelectedToken error: ', error);
    return false;
  }
};

export const isCustomToken = (tokenStatus: number): boolean => {
  if ([1, 2].includes(tokenStatus)) {
    return true;
  }
  return false;
};

export const getTokenId = (token: AssetItemType) => {
  try {
    const { type, id, contractAddress } = token;

    if (type === 1 || type === 0) {
      return id;
    } else if (type === 2 || type === 5) {
      return contractAddress;
    } else {
      return '';
    }
  } catch (error) {
    log.info('getTokenId error: ', error);
    return '';
  }
};

export const isRiskToken = async (
  tokenAddress: string,
  selectedAddress: string,
): Promise<boolean> => {
  try {
    const res = await checkIsRiskToken(selectedAddress, tokenAddress);
    if (res.success && res.data) {
      return true;
    }
    return false;
  } catch (error) {
    log.info('isRiskToken error: ', error);
    return false;
  }

  return false;
};
