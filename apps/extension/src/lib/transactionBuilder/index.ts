import _ from 'lodash';
import Contracts from './contracts.json';

export const transactionBuilder = async (
  tronWeb: any,
  contractType: boolean | string = false,
  parameters = false,
) => {
  // eslint-disable-next-line
  if (contractType && !Contracts.hasOwnProperty(contractType.toString()))
    return { error: `Contract type ${contractType} not supported` };

  // @ts-ignore
  const endpoint = Contracts[contractType];

  return {
    mapped: await tronWeb.fullNode.request(endpoint, parameters, 'post'),
  };
};

export const getEnergyUsed = async (tronWeb: any, input: any) => {
  const res = await tronWeb.fullNode.request('wallet/triggerconstantcontract', input, 'post');
  const energyUsed = _.get(res, 'energy_used', 0);
  return energyUsed;
};
