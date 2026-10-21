import { FC } from 'react';

import TransferContractPage from './components/TransferContractPage';
import TransferAssetContractPage from './components/TransferAssetContractPage';
import VoteWitnessContractPage from './components/VoteWitnessContractPage';
import FreezeBalanceContractPage from './components/FreezeBalanceContractPage';
import UnFreezeBalanceContractPage from './components/UnFreezeBalanceContractPage';
import TriggerSmartContractPage from './components/TriggerSmartContractPage';

import { ParamsInfoType, CostsType } from '../../hooks';
import OtherTransactionPage from './components/OtherTransactionPage';

interface Props {
  tabIndex: number;
  changeTab: (tabIndex: number) => void;
  confirmation: ConfirmationObj;
  paramsInfo: ParamsInfoType;
  costs: CostsType;
}

const SignTransaction: FC<Props> = ({ tabIndex, changeTab, confirmation, paramsInfo, costs }) => {
  const contractType = confirmation?.contractType;
  if (contractType === 'TransferContract') {
    return (
      <TransferContractPage
        tabIndex={tabIndex}
        changeTab={changeTab}
        contractType={contractType}
        confirmation={confirmation}
        paramsInfo={paramsInfo}
        costs={costs}
      />
    );
  }
  if (contractType === 'TransferAssetContract') {
    return (
      <TransferAssetContractPage
        tabIndex={tabIndex}
        changeTab={changeTab}
        contractType={contractType}
        confirmation={confirmation}
        paramsInfo={paramsInfo}
        costs={costs}
      />
    );
  }
  if (contractType === 'VoteWitnessContract') {
    return (
      <VoteWitnessContractPage
        tabIndex={tabIndex}
        changeTab={changeTab}
        contractType={contractType}
        confirmation={confirmation}
        paramsInfo={paramsInfo}
        costs={costs}
      />
    );
  }
  if (contractType === 'FreezeBalanceContract') {
    return (
      <FreezeBalanceContractPage
        tabIndex={tabIndex}
        changeTab={changeTab}
        contractType={contractType}
        confirmation={confirmation}
        paramsInfo={paramsInfo}
        costs={costs}
      />
    );
  }
  if (contractType === 'UnfreezeBalanceContract') {
    return (
      <UnFreezeBalanceContractPage
        tabIndex={tabIndex}
        changeTab={changeTab}
        contractType={contractType}
        confirmation={confirmation}
        paramsInfo={paramsInfo}
        costs={costs}
      />
    );
  }
  if (contractType === 'TriggerSmartContract') {
    return (
      <TriggerSmartContractPage
        tabIndex={tabIndex}
        changeTab={changeTab}
        contractType={contractType}
        confirmation={confirmation}
        paramsInfo={paramsInfo}
        costs={costs}
      />
    );
  }
  return (
    <OtherTransactionPage
      tabIndex={tabIndex}
      changeTab={changeTab}
      contractType={contractType}
      confirmation={confirmation}
      paramsInfo={paramsInfo}
      costs={costs}
    />
  );
};

export default SignTransaction;
