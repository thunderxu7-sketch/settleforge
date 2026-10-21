import { useIntl } from 'react-intl';
import classNames from 'classnames';

import NavBar from '../../../components/NavBar/NavBar';

import PAGES from '../../../constants/pages';
import { CURRENCY_OPTIONS, LANGUAGE_OPTIONS, LEDGER_CONNECTION_OPTIONS } from './constants';
import SettingRow from './components/SettingRow';
import SettingRowRadio from './components/SettingRowRadio';

import { useSetting } from './hook';

import styles from './SettingsPage.m.scss';

import iconCurrency from './images/icon-currency.svg';
import iconNode from './images/icon-node.svg';
import iconLanguage from './images/icon-language.svg';
import iconLedger from './images/icon-ledger.svg';
import iconAbout from './images/icon-about.svg';

const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const {
    state,
    goBack,
    onClickLogOut,
    onClickRadioRow,

    currencySelectedValue,
    onChangeCurrency,
    getSelectedCurrency,

    languageSelectedValue,
    onChangeLanguage,
    getSelectedLanguage,

    ledgerConnectionSelectedValue,
    onChangeLedgerConnection,
    getSelectedLedgerConnection,
  } = useSetting();

  const { currency, language, ledgerConnection } = state;
  return (
    <div className={classNames(styles.container, 'col')}>
      <NavBar title="SETTING.TITLE" onClickLeft={goBack} />

      <div className={classNames(styles.optionsWrap, 'scroll')}>
        {/* node manage */}
        <SettingRow
          name={'SETTING.TITLE.NODE_MANAGE'}
          icon={iconNode}
          targetPage={PAGES.PAGE_NODE_MANAGEMENT}
        />

        {/* currency setting */}
        <SettingRowRadio
          name="SETTING.TITLE.CURRENCY"
          icon={iconCurrency}
          options={CURRENCY_OPTIONS}
          optionVisible={currency}
          onClickRow={() => onClickRadioRow('currency')}
          selectedValue={currencySelectedValue}
          onChangeStringValue={onChangeCurrency}
          getSelectedText={getSelectedCurrency}
        />

        {/* language setting */}
        <SettingRowRadio
          name="SETTING.TITLE.LANGUAGE"
          icon={iconLanguage}
          options={LANGUAGE_OPTIONS}
          optionVisible={language}
          onClickRow={() => onClickRadioRow('language')}
          selectedValue={languageSelectedValue}
          onChangeStringValue={onChangeLanguage}
          getSelectedText={getSelectedLanguage}
        />

        {/* ledger connection setting */}
        <SettingRowRadio
          name="SETTING.TITLE.LEDGER"
          icon={iconLedger}
          options={LEDGER_CONNECTION_OPTIONS}
          optionVisible={ledgerConnection}
          tips="WALLET.LEDGER.CONNECT_EXPLAIN"
          onClickRow={() => onClickRadioRow('ledgerConnection')}
          selectedValue={ledgerConnectionSelectedValue}
          onChangeStringValue={onChangeLedgerConnection}
          getSelectedText={getSelectedLedgerConnection}
        />

        {/* about us */}
        <SettingRow name="SETTING.TITLE.ABOUT" icon={iconAbout} targetPage={PAGES.PAGE_ABOUT} />

        {/* sign out */}
        {/*<SettingRow*/}
        {/*  name="SETTING.TITLE.LOCK"*/}
        {/*  icon={iconLock}*/}
        {/*  targetPage={PAGES.PAGE_LOGIN}*/}
        {/*  onClickRow={onClickLogOut}*/}
        {/*/>*/}
      </div>
      <button onClick={onClickLogOut} className={styles.logoutButton}>
        {formatMessage({ id: 'SETTING.TITLE.LOCK' })}
      </button>
    </div>
  );
};

export default SettingsPage;
