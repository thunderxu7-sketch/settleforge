import { Input } from 'antd';
import { ChangeEvent, FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from '../ManualPathPage.m.scss';

interface Props {
  name: string;
  updateWalletName: (event: ChangeEvent<HTMLInputElement>) => void;
  isNameError: boolean;
}

const WalletName: FC<Props> = ({ name, updateWalletName, isNameError }) => {
  const { formatMessage } = useIntl();
  return (
    <div className={styles.walletPassword}>
      <div className={styles.name}>
        <FormattedMessage id="HD.SET_WALLET_NAME" />
      </div>
      <Input
        allowClear
        placeholder={formatMessage({ id: 'HD.SET_WALLET_NAME' })}
        value={name}
        onChange={updateWalletName}
        maxLength={14}
      />

      {isNameError && (
        <div className={styles.nameError}>
          <FormattedMessage id="WALLET.NAME.LENGTH_RULE" />
        </div>
      )}
    </div>
  );
};

export default memo(WalletName);
