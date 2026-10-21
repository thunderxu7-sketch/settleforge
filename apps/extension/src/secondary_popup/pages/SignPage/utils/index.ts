// @ts-ignore
import TronWeb from 'tronweb';
import _ from 'lodash';
import log from 'loglevel';

import {
  searchTokens,
  getCollectionInfo,
  getWitnessInfo,
  getDelegatedResource,
  getWhiteTokens,
} from '../../../../service/local_data_service';
import { resourceManager } from '../../../../domain/resource_manager';

import { isRiskAsset } from '../../../../popup/utils/assetUtils';
import { BigNumber } from '../../../../popup/utils/numberUtils';

import { REFER_ABI } from '../constants';
import { BigNumberType } from '../../../../constants/types';

export const getAllLocalTokens = async (selectedAddress: string, selectedNode: string) => {
  try {
    await resourceManager.getResourceInfoFromStorage();

    const {
      followedAsset = [],
      followedCollection = [],
      unFollowedAsset = [],
      unFollowedCollection = [],
      newAsset = [],
      newCollection = [],
    } = await resourceManager.getAllAssetList(selectedAddress, selectedNode);

    return {
      tokens: [
        ...followedAsset,
        ...followedCollection,
        ...unFollowedAsset,
        ...unFollowedCollection,
        ...newAsset,
        ...newCollection,
      ],
    };
  } catch (error) {
    log.error('getAllLocalTokens error: ', error);
    return {};
  }
};

export const searchTokenInfo = async (
  tokenId,
  selectedAddress,
  selectedNode,
  type: number,
  assetId = false,
) => {
  const { tokens } = await getAllLocalTokens(selectedAddress, selectedNode);

  let tokenInfo = _.find(tokens, (item) => {
    if (type === 1) {
      return String(tokenId) === String(item.id);
    }
    if (type === 0) {
      return 0 === Number(item.type);
    }
    return String(tokenId) === String(item.contractAddress);
  });

  if (_.size(tokenInfo) === 0 && tokenId) {
    const res = await searchTokens(selectedAddress, tokenId);
    if (res.success) {
      const tokens = res.data;
      tokenInfo = _.get(tokens, 'token.0');
    }
  }
  // check is risk token
  const isRisk = isRiskAsset(tokenInfo);

  tokenInfo = Object.assign(
    {
      isRisk,
    },
    tokenInfo,
  );

  if (tokenInfo?.type === 5) {
    const res = await getCollectionInfo(selectedAddress, tokenId, assetId);
    const data = res.data;

    tokenInfo.assetName = data?.name;
    tokenInfo.assetLogo = data?.logoUrl || data?.imageUrl;
  }
  return tokenInfo;
};

export const getParamsInfoOfTransferContract = async ({
  input,
  contractType,
  rawDataHex,
  selectedAddressItem,
  addressBooks,
}) => {
  try {
    const { owner_address, to_address, amount = 0 } = input;
    const tokenInfo = {
      symbol: 'TRX',
      precision: 6,
      type: 0,
      isOfficial: 1,
    };
    const decimal = _.get(tokenInfo, 'precision', 0);
    const fromAddress = TronWeb.address.fromHex(owner_address);
    const toAddress = TronWeb.address.fromHex(to_address);
    const paramsInfo = {
      fromAddress,
      toAddress,
      amount: new BigNumber(amount).shiftedBy(-decimal),
      decimal,
      fromAddressName:
        selectedAddressItem?.address === fromAddress ? selectedAddressItem?.name : '',
      toAddressName: addressBooks[toAddress]?.name,
      unit: 'TRX',
      contractType,
      rawDataHex,
      tokenInfo,
    };
    return paramsInfo;
  } catch (e) {
    console.error('getParamsInfoOfTransferContract error: ', e);

    return {};
  }
};

export const getParamsInfoOfTransferAssetContract = async ({
  input,
  contractType,
  rawDataHex,
  selectedAddressItem,
  addressBooks,
}) => {
  try {
    const { owner_address, asset_name = '', to_address, amount = 0 } = input;
    const assetName = TronWeb.toUtf8(asset_name);
    const fromAddress = TronWeb.address.fromHex(owner_address);
    const toAddress = TronWeb.address.fromHex(to_address);
    const paramsInfo = {
      fromAddress,
      toAddress,
      tokenId: assetName,
      amount,
      fromAddressName:
        selectedAddressItem?.address === fromAddress ? selectedAddressItem?.name : '',
      toAddressName: addressBooks[toAddress]?.name,
      contractType,
      rawDataHex,
    };
    return paramsInfo;
  } catch (e) {
    console.error('getParamsInfoOfTransferAssetContract error: ', e);

    return {};
  }
};

export const getSuperNodeInfo = async (selectedAddress: string, votes = []) => {
  try {
    const superNodeInfo = [];
    const res = await getWitnessInfo(selectedAddress);
    if (res.success) {
      const nodeInfo = _.keyBy(_.get(res, 'data.data', []), 'address');
      for (const vote of votes) {
        const addressHex = _.get(vote, 'vote_address');
        if (addressHex) {
          const address = TronWeb.address.fromHex(addressHex);
          const voteCount = _.get(vote, 'vote_count', 0);
          const mapperInfo = _.get(nodeInfo, address);
          let name;
          if (mapperInfo) {
            name = _.get(mapperInfo, 'name');
          }
          const item = {
            address,
            voteCount,
            name,
          };
          superNodeInfo.push(item);
        }
      }
      return superNodeInfo;
    } else {
      return [];
    }
  } catch (e) {
    return [];
  }
};

export const getParamsInfoOfVoteWitnessContract = async (input, rawDataHex) => {
  const { owner_address, votes } = input;
  const fromAddress = TronWeb.address.fromHex(owner_address);
  try {
    const paramsInfo = {
      fromAddress,
      votes,
      rawDataHex,
    };
    return paramsInfo;
  } catch (e) {
    console.error('getParamsInfoOfVoteWitnessContract error: ', e);
    return {
      fromAddress,
      votes,
    };
  }
};

export function showFormat(str: string, preLen = 8, nextLen = 8) {
  if (_.size(str) > preLen + nextLen + 3) {
    return str.substring(0, preLen) + '...' + str.substring(str.length - nextLen);
  }
  return str;
}

export const getParamsInfoOfFreezeBalanceContract = ({
  input,
  rawDataHex,
  selectedAddressItem,
  addressBooks,
}) => {
  const {
    owner_address,

    resource,
    receiver_address,
    frozen_balance = 0,
  } = input;
  const fromAddress = TronWeb.address.fromHex(owner_address);
  const toAddress = TronWeb.address.fromHex(receiver_address || owner_address);
  const paramsInfo = {
    resource,
    fromAddress,
    toAddress,
    frozenBalance: new BigNumber(frozen_balance).shiftedBy(-6),
    fromAddressName: selectedAddressItem?.address === fromAddress ? selectedAddressItem?.name : '',
    toAddressName: addressBooks[toAddress]?.name,
    rawDataHex,
  };
  return paramsInfo;
};

export const getUnfreezeResource = async (
  ownerAddress: string,
  type: 1 | 2,
  sourceType: 1 | 2,
  receiverAddress: string,
  tronWebInstance: any,
) => {
  try {
    let unfreezeBalance = 0;
    if (ownerAddress === receiverAddress) {
      const res = await tronWebInstance.trx.getUnconfirmedAccount(ownerAddress);
      if (sourceType === 1) {
        unfreezeBalance = _.get(res, 'frozen.0.frozen_balance', 0);
      } else {
        // energy
        unfreezeBalance = _.get(
          res,
          'account_resource.frozen_balance_for_energy.frozen_balance',
          0,
        );
      }
      unfreezeBalance = new BigNumber(unfreezeBalance).shiftedBy(-6).toNumber();
    } else {
      const res = await getDelegatedResource(ownerAddress, type, sourceType);
      const data = _.get(res, 'data', []);
      const resourceItem = _.find(data, (item) => {
        return item.receiverAddress === receiverAddress;
      });
      unfreezeBalance = new BigNumber(_.get(resourceItem, 'frozenBalance', 0))
        .shiftedBy(-6)
        .toNumber();
    }
    return unfreezeBalance;
  } catch (e) {
    log.error('getUnfreezeResource error: ', e);
    return '--';
  }
};

export const getParamsInfoOfUnfreezeBalanceContract = async ({
  input,
  rawDataHex,
  addressBooks,
}) => {
  try {
    const { owner_address, resource, receiver_address } = input;
    const fromAddress = TronWeb.address.fromHex(owner_address);
    const toAddress = TronWeb.address.fromHex(receiver_address || owner_address);
    const paramsInfo = {
      resource,
      fromAddress,
      toAddress,
      fromAddressName: addressBooks[fromAddress]?.name,
      toAddressName: addressBooks[toAddress]?.name,
      rawDataHex,
    };
    return paramsInfo;
  } catch (e) {
    log.error('getParamsInfoOfUnfreezeBalanceContract:', e);
    return {};
  }
};

export const getAbiCode = async (contractAddress: string, tronWebInstance: any) => {
  try {
    const contract = await tronWebInstance.contract().at(contractAddress);
    return contract.abi;
  } catch (e) {
    console.warn('get abi error:', e);
    return [];
  }
};

const getParamTypes = (params: Array<any>) => {
  return params.map(({ type }) => type);
};

const getFunctionSelector = (abi: any) => {
  return abi.name + '(' + getParamTypes(abi.inputs || []).join(',') + ')';
};

export const decodeParams = (message: string, abiCode: any, function_selector: string) => {
  const cutArr = function_selector.match(/(.+)\((.*)\)/);
  if (cutArr && cutArr[2] !== '') {
    const filterAbi = abiCode.find((abi) => getFunctionSelector(abi) === function_selector);
    if (filterAbi) {
      const names = filterAbi.inputs.map(({ name }) => name).filter((name) => !!name);
      const types = filterAbi.inputs.map(({ type }) => type);
      const output = message.toString().startsWith('0x') ? message : '0x' + message;
      const decodeMessage = TronWeb.utils.abi.decodeParams(names, types, output);

      return names.map((name, index) => {
        const type = types[index];
        let value = decodeMessage[name];
        if (type === 'address') {
          value = TronWeb.address.fromHex(decodeMessage[name]);
        } else if (type === 'trcToken' || type.indexOf('int') > -1) {
          if (value._isBigNumber || value._hex) {
            value = new BigNumber(value._hex).toFixed();
          } else {
            value = new BigNumber(value).toFixed();
          }
          if (new BigNumber(value).isNaN()) {
            value = '--';
          }
        }
        return { name, type, value };
      });
    } else {
      return [];
    }
  }
};

const getFunctionName = (abiCode: Array<any>, function_selector: string) => {
  const filterAbi = abiCode.find((abi) => getFunctionSelector(abi) === function_selector);
  if (filterAbi) {
    return filterAbi.name;
  }
  return null;
};

export const getContractInfo = async (
  selectedAddress: string,
  toAddress: string,
  tronWebInstance: any,
) => {
  try {
    const contractAddressInfo: Record<string, any> = {};
    const res = await getWhiteTokens(selectedAddress, toAddress);
    if (res.success) {
      const whiteTokenInfo = res.data;
      const isWhite = _.get(whiteTokenInfo, 'white', false);
      const projectName = _.get(whiteTokenInfo, 'projectName');
      contractAddressInfo.isWhite = isWhite;
      contractAddressInfo.projectName = projectName;
      contractAddressInfo.isContract = isWhite;

      if (!isWhite) {
        const res = await tronWebInstance.trx.getUnconfirmedAccount(toAddress);
        const type = _.get(res, 'type', '');
        contractAddressInfo.isContract = type === 'Contract';
      }
      return contractAddressInfo;
    } else {
      return false;
    }
  } catch (e) {
    console.warn('checkAddressIsContract error:', e);
    return false;
  }
};

export const isCustomToken = (tokenStatus: number) => {
  if ([1, 2].includes(tokenStatus)) {
    return true;
  }
  return false;
};

export const isKnownFunction = (functionSelector: string) => {
  return (
    'transfer(address,uint256)' === functionSelector ||
    'approve(address,uint256)' === functionSelector ||
    'transferFrom(address,address,uint256)' === functionSelector ||
    'transfer' === functionSelector ||
    'transferFrom' === functionSelector
    // 'approve' === functionSelector ||
  );
};

export const getParamsInfoOfTriggerSmartContract = async ({
  input,
  rawDataHex,
  selectedAddress,
  selectedAddressItem,
  selectedNode,
  addressBooks,
}) => {
  try {
    const {
      parameter,
      contract_address,
      function_selector,
      token_id,
      call_token_value,
      call_value,
      owner_address,
    } = input;
    let abi = [];
    let args = [];
    let functionName;
    let tokenInfo;
    let fromAddress = '';
    let toAddress = '';
    let paramsInfo = {};
    try {
      // when is other function selector, need get abi code from chain, deal in another function to show page content quickly
      if (isKnownFunction(function_selector)) {
        abi = REFER_ABI;
        args = decodeParams(parameter, abi, function_selector);
        functionName = getFunctionName(abi, function_selector);
      }
    } catch (e) {
      console.warn('get abi error:', e);
    }
    const contractAddress = TronWeb.address.fromHex(contract_address);
    // const match = String(function_selector).match(/[\w-]+/);
    // if (!functionName && typeof match === 'object') {
    //   functionName = _.get(match, '0');
    // }
    if ('transfer' === functionName || 'transfer(address,uint256)' === function_selector) {
      toAddress = '';
      let amount: string | BigNumberType = '';
      const fromAddress = TronWeb.address.fromHex(owner_address);

      if (_.size(args) >= 2) {
        toAddress = _.get(args, '0.value');
        amount = _.get(args, '1.value');
      }
      paramsInfo = {
        toAddress,
        fromAddress,
        amount,
        contractAddress,
        fromAddressName:
          selectedAddressItem?.address === fromAddress ? selectedAddressItem?.name : '',
        toAddressName: _.get(addressBooks, toAddress + '.name'),
        functionName: 'transfer',
        args,
        rawDataHex,
      };
    } else if (
      'transferFrom' === functionName ||
      'transferFrom(address,address,uint256)' === function_selector
    ) {
      fromAddress = _.get(args, '0.value', '');
      toAddress = _.get(args, '1.value', '');
      const amount = _.get(args, '2.value', 0);
      paramsInfo = {
        fromAddress,
        toAddress,
        amount,
        contractAddress,
        fromAddressName:
          selectedAddressItem?.address === fromAddress ? selectedAddressItem?.name : '',
        toAddressName: _.get(addressBooks, toAddress + '.name'),
        functionName: 'transferFrom',
        args,
        rawDataHex,
      };
    } else if ('approve(address,uint256)' === function_selector) {
      // } else if ('approve' === functionName || 'approve(address,uint256)' === function_selector) {
      let amount = '';
      let toAddress = '';

      if (_.size(args) >= 2) {
        toAddress = _.get(args, '0.value');
        amount = _.get(args, '1.value');
      }
      paramsInfo = {
        amount,
        toAddress,
        contractAddress,
        toAddressName: _.get(addressBooks, toAddress + '.name'),
        functionName: 'approve',
        args,
        rawDataHex,
      };
    } else {
      paramsInfo = {
        toAddress,
        contractAddress,
        toAddressName: _.get(addressBooks, toAddress + '.name'),
        functionName,
        tokenInfo,
        args,
        rawDataHex,
      };
      // need call value
      if (call_value > 0) {
        const callValueUnit = 'TRX';
        const callValue = new BigNumber(call_value || 0).shiftedBy(-6).toFormat();
        paramsInfo = Object.assign(paramsInfo, {
          callValue,
          callValueUnit,
        });
      }
      // need call token value
      if (token_id && call_token_value > 0) {
        const callTokenValueInfo = await searchTokenInfo(
          token_id,
          selectedAddress,
          selectedNode,
          1,
        );
        const callTokenValueDecimal = _.get(callTokenValueInfo, 'precision', 0);
        const callTokenValue = new BigNumber(call_token_value || 0)
          .shiftedBy(-callTokenValueDecimal)
          .toFormat();
        paramsInfo = Object.assign(paramsInfo, {
          callTokenValue,
          callTokenValueUnit: _.get(tokenInfo, 'shortName', ''),
        });
      }
    }
    return paramsInfo;
  } catch (e) {
    log.error('getParamsInfoOfTriggerSmartContract:', e);
    return {};
  }
};
