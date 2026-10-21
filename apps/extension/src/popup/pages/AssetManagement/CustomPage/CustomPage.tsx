import {useAssetsManagementBiz} from './hook';
import NavBar from '../../../../components/NavBar/NavBar';

import CustomInfo from './components/CustomInfo';
import AddCustom from './components/AddCustom';

const CustomPage = () => {
  const { afterAddrChange, toStep, state, addToken, onNextBtnClick, setInputAbbr, setInputName } =
    useAssetsManagementBiz();
  const { customTokenInfo, addressValueStatus, inputAbbr, inputName } = state;
  const { abbr, name, type, decimal } = customTokenInfo;

  return (
    <>
      <NavBar title="ASSET.CUSTOM.ENTRY_TITLE" />
      {addressValueStatus?.step !== 2 ? (
        <CustomInfo
          afterAddrChange={afterAddrChange}
          abbr={abbr}
          name={name}
          type={type}
          decimal={decimal}
          inputAbbr={inputAbbr}
          inputName={inputName}
          address={addressValueStatus}
          onNextBtnClick={onNextBtnClick}
          setInputAbbr={setInputAbbr}
          setInputName={setInputName}
        />
      ) : (
        <AddCustom
          customTokenInfo={customTokenInfo}
          toStep={toStep}
          addToken={addToken}
          inputAbbr={inputAbbr}
          inputName={inputName}
        />
      )}
    </>
  );
};

export default CustomPage;
