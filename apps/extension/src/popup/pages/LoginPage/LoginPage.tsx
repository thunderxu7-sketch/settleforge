import classNames from 'classnames';

import Password from './components/Password';
import Button from '../../../components/Button';
import Header from './components/Header';
import Footer from './components/Footer';
import Error from './components/Error';
import WarningModal from './components/WarningModal';

import { useLoginBiz } from './hook';

import styles from './LoginPage.m.scss';

const LoginPage = () => {
  const {
    state,
    updatePassword,
    checkPassword,
    loginByOtherWay,
    createNewWallet,
    onConfirmNextPage,
    hideWaning,
  } = useLoginBiz();

  const { isProcessing, isPasswordValid, errorMsgID, isWarningVisible } = state;

  return (
    <div className={classNames(styles.container, 'col')}>
      <Header />

      <Password
        value={state.password}
        isDisabled={state.isProcessing}
        onChangeText={updatePassword}
        onEnter={checkPassword}
        placeholder="INPUT.PASSWORD"
        type="password"
        tabIndex={1}
      />

      <Error errorMsgID={errorMsgID} />

      <Button
        id="LOGIN.PASSWORD.UNLOCK"
        isValid={isPasswordValid}
        isLoading={isProcessing}
        onClick={checkPassword}
        className={styles.loginButton}
        tabIndex={2}
      />

      <Footer loginByOtherWay={loginByOtherWay} createNewWallet={createNewWallet} />

      <WarningModal
        isVisible={isWarningVisible}
        onConfirm={onConfirmNextPage}
        onClose={hideWaning}
      />
    </div>
  );
};

export default LoginPage;
