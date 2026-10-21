import { FC } from 'react';

import ApprovePage from './ApprovePage';
import TransferPage from './TransferPage';
import OtherTriggerSmartContractPage from './OtherTriggerSmartContractPage';

import { ParamsInfoType, CostsType } from '../../../../hooks';
interface Props {
  tabIndex: number;
  changeTab: (tabIndex: number) => void;
  contractType: string;
  confirmation: ConfirmationObj;
  paramsInfo: ParamsInfoType;
  costs: CostsType;
}
const TriggerSmartContractPage: FC<Props> = ({
  tabIndex,
  changeTab,
  contractType,
  confirmation,
  paramsInfo,
  costs,
}) => {
  const { functionName } = paramsInfo;

  if (functionName === 'approve') {
    return (
      <ApprovePage
        tabIndex={tabIndex}
        changeTab={changeTab}
        paramsInfo={paramsInfo}
        confirmation={confirmation}
        costs={costs}
      />
    );
  }
  if (functionName === 'transfer' || functionName === 'transferFrom') {
    return (
      <TransferPage
        tabIndex={tabIndex}
        changeTab={changeTab}
        paramsInfo={paramsInfo}
        confirmation={confirmation}
        costs={costs}
      />
    );
  }
  return (
    <OtherTriggerSmartContractPage
      tabIndex={tabIndex}
      changeTab={changeTab}
      paramsInfo={paramsInfo}
      confirmation={confirmation}
      costs={costs}
    />
  );
};

export default TriggerSmartContractPage;
