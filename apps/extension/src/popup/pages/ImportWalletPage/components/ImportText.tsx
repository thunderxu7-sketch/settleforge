import type { ChangeEvent } from 'react';
import { FC, memo } from 'react';
import { Input } from 'antd';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import _ from 'lodash';

import styles from './../ImportWalletPage.m.scss';

const { TextArea } = Input;

interface Props extends Omit<React.HTMLProps<HTMLInputElement>, 'onChange'> {
  step: number;
  originText?: string;
  msg?: string;
  flatList?: string[];
  onTextChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSelectMnemonic: (value: string) => void;
}

const ImportText: FC<Props> = ({
  step,
  originText,
  msg,
  flatList,
  onTextChange,
  onSelectMnemonic,
}) => {
  const { formatMessage } = useIntl();

  return (
    <div
      className={classNames(styles.walletTextarea, {
        [styles.hasValue]: _.size(originText) > 0,
      })}
    >
      <TextArea
        rows={6}
        autoSize={false}
        allowClear={true}
        className={styles.contentInput}
        placeholder={formatMessage({ id: 'WALLET.IMPORT.INPUT_PLACEHOLDER' })}
        value={originText}
        onChange={onTextChange}
      />

      {msg && <div className={styles.errorMsg}>{msg}</div>}

      {step == 0 && flatList && flatList.length > 0 && (
        <div className={styles.flat}>
          {flatList.map((word) => {
            return (
              <span key={word} onClick={() => onSelectMnemonic(word)}>
                {word}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(ImportText);
