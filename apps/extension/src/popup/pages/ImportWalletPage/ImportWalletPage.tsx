import NavBar from '../../../components/NavBar/NavBar';
import ImportText from './components/ImportText';
import ActionButton from './components/ActionButton';
import WalletInfo from './components/WalletInfo';
import ImportKeystoreFileLink from './components/ImportKeystoreFileLink';
import { useImportWalletBiz } from './hook';

import styles from './ImportWalletPage.m.scss';

const ImportWalletPage = () => {
  const {
    msg,
    originText,
    flatList,
    onInputOriginText,
    onStep0Click,
    onStep1Click,
    goBack,
    step,
    importName,
    isNameError,
    importType,
    onInputName,
    password,
    isSamePassword,
    isValidPassword,
    confirmPassword,
    isNeedPassword,
    onChangePassword,
    onChangePasswordState,
    onSelectMnemonic,
    setOriginText,
  } = useImportWalletBiz();

  return (
    <>
      <NavBar onClickLeft={goBack} title="GUIDE.IMPORT_WALLET" />
      <div className={styles.content}>
        <ImportText
          step={step}
          originText={originText}
          msg={msg}
          flatList={flatList}
          onTextChange={onInputOriginText}
          onSelectMnemonic={onSelectMnemonic}
        />

        <WalletInfo
          step={step}
          importType={importType}
          importName={importName}
          isNameError={isNameError}
          onChangeName={onInputName}
          password={password}
          isSamePassword={isSamePassword}
          confirmPassword={confirmPassword}
          isNeedPassword={isNeedPassword}
          onChangePassword={onChangePassword}
          onChangePasswordState={onChangePasswordState}
        />
      </div>

      <ActionButton
        step={step}
        importType={importType}
        originText={originText}
        isNameError={isNameError}
        msg={msg}
        password={password}
        isNeedPassword={isNeedPassword}
        isSamePassword={isSamePassword}
        isValidPassword={isValidPassword}
        onClick={step === 0 ? onStep0Click : onStep1Click}
      />

      <ImportKeystoreFileLink onTextChange={setOriginText} />
    </>
  );
};

export default ImportWalletPage;
