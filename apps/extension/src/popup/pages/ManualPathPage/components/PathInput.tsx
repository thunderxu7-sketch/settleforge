import { ChangeEvent, FC, memo, useCallback } from 'react';
import classnames from 'classnames';

import styles from '../ManualPathPage.m.scss';

interface Props {
  accountIndex: number;
  addressIndex: number;
  onChange: (value: { accountIndex?: number; addressIndex?: number }) => void;
}

const PathInput: FC<Props> = ({ accountIndex, addressIndex, onChange }) => {
  const onChangeAccountIndex = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ accountIndex: Number(e.target.value.trim()) });
    },
    [onChange],
  );

  const onChangeAddressIndex = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ addressIndex: Number(e.target.value.trim()) });
    },
    [onChange],
  );

  return (
    <div className={classnames(styles.walletPath, 'flex')}>
      <span>m / 44 &#39;/ 195&#39; / </span>
      <input value={accountIndex} onChange={onChangeAccountIndex} />
      <span>&#39;/0/ </span>
      <input value={addressIndex} onChange={onChangeAddressIndex} />
    </div>
  );
};

export default memo(PathInput);
