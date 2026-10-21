import { memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { Account } from '../../popup/pages/SwitchSeedPage/hook';
import { cutMiddle } from '../../popup/utils';

import styles from './AccountRowSwitchSeed.m.scss';

interface Props {
  account: Account;
  originAddress: string;
  onSelect: (account: Account) => void;
}

const AccountRowSwitchSeed = ({ account, originAddress, onSelect }: Props) => {
  const { name, address, addressIndex, relatedCount } = account;

  // const markedAddress = address.substring(0, 10) + '...' + address.substring(address.length - 10);

  return (
    <div
      className={classNames(
        styles.addressInfo,
        {
          [styles.active]: originAddress === address,
        },
        'scroll',
      )}
      onClick={() => onSelect(account)}
    >
      <div className={classNames(styles.aiTitle, 'flex')}>
        <span>{name}</span>
        <span className={styles.selectAddress} />
      </div>
      <div className={styles.aiBalance}>{cutMiddle(address)}</div>
      <div className={classNames(styles.aiPath, 'flex')}>
        <span>index:{addressIndex}</span>
        <span>
          <FormattedMessage id="HD.ACCOUNTS" />:{relatedCount}
        </span>
      </div>
    </div>
  );
};

export default memo(AccountRowSwitchSeed);
