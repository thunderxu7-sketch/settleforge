import NavBar from '../../../components/NavBar/NavBar';
import ConfirmModal from './components/ConfirmModal';
import AdvancedOptions from './components/AdvancedOptions';

import { useNewHDAddressBiz } from './hook';

const NewHDAddressPage = () => {
  const { state, toggleConfirmModal, onSubmit, switchSeed, onChangeWalletName, gotoManualPath } =
    useNewHDAddressBiz();

  const {
    isConfirmModalVisible,
    deriveAccount,
    originAddress,
    name,
    originName,
    isNameError,
    remind,
    mnemonicAccountCount,
  } = state;

  return (
    <>
      <NavBar title="HD.REQUEST_NEW_ADDRESS" />

      <AdvancedOptions
        name={name}
        originName={originName}
        isNameError={isNameError}
        originAddress={originAddress}
        remind={remind}
        deriveAccount={deriveAccount!}
        mnemonicAccountCount={mnemonicAccountCount}
        onChangeWalletName={onChangeWalletName}
        toggleConfirmModal={toggleConfirmModal}
        onSubmit={onSubmit}
        switchSeed={switchSeed}
      />

      <ConfirmModal
        isVisible={isConfirmModalVisible}
        onClose={toggleConfirmModal}
        gotoManualPath={gotoManualPath}
      />
    </>
  );
};

export default NewHDAddressPage;
