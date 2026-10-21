import { FormattedMessage } from 'react-intl';

import AccountRowSwitchSeed from '../../../components/AccountRow/AccountRowSwitchSeed';
import { useSwitchSeedBiz } from './hook';

import styles from './SwitchSeedPage.m.scss';
import NavBar from '../../../components/NavBar/NavBar';
import classNames from 'classnames';

const SwitchSeedPage = () => {
  const { state, onSelectRow, onSubmit } = useSwitchSeedBiz();

  const { accounts, originAddress } = state;

  return (
    <>
      <NavBar title="HD.CHANGE_ACCOUNT" />

      <div className={styles.content}>
        <p className={classNames(styles.titleTips, 'flex')}>
          <span>
            <FormattedMessage id="HD.ADDRESS_TO_ACCOUNT" />
          </span>
        </p>

        <div className={classNames(styles.addressInfos, 'scroll')}>
          {accounts.map((account: any, index: number) => {
            return (
              <AccountRowSwitchSeed
                key={index}
                account={account}
                originAddress={originAddress}
                onSelect={onSelectRow}
              />
            );
          })}
        </div>

        <div className={styles.button} onClick={onSubmit}>
          <FormattedMessage id="WALLT.IMPORT.CONFIRM_BTN" />
        </div>
      </div>
    </>
  );
};

export default SwitchSeedPage;
