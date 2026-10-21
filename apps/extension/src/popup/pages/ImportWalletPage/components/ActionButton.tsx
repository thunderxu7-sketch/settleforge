import type { MouseEvent } from 'react';
import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import classNames from 'classnames';
import styles from './../ImportWalletPage.m.scss';
import { WALLET_IMPORT_TYPE } from '../../../../constants/wallet_type';

interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'onClick'> {
  step: number;
  importType: string;
  originText: string;
  msg: string;
  isNameError: boolean;
  password: string;
  isNeedPassword: boolean;
  isSamePassword: boolean;
  isValidPassword: boolean;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
}

const ActionButton: FC<Props> = ({
  step,
  importType,
  originText,
  msg,
  isNameError,
  password,
  isNeedPassword,
  isSamePassword,
  isValidPassword,
  onClick,
}) => {
  let btnId = 'WALLT.IMPORT.NEXT_BTN';
  if (step === 1) {
    if (importType === WALLET_IMPORT_TYPE.KEYSTORE) {
      btnId = 'WALLT.IMPORT.KEYSTORE_BTN';
    } else if (importType === WALLET_IMPORT_TYPE.PRIVATE_KEY) {
      btnId = 'WALLT.IMPORT.PRIVATE_KEY';
    } else if (importType === WALLET_IMPORT_TYPE.MNEMONIC) {
      btnId = 'WALLT.IMPORT.IMPORT_MNEMONIC';
    }
  }

  const firstImportWalletIsDisabled =
    step === 1 &&
    ((importType !== WALLET_IMPORT_TYPE.KEYSTORE &&
      isNeedPassword &&
      (!isSamePassword || !isValidPassword || _.size(password) === 0)) ||
      isNameError);

  const isDisabled = _.size(originText) === 0 || _.size(msg) > 0 || firstImportWalletIsDisabled;

  return (
    <div
      className={classNames(styles.commonBtn, { [styles.disabled]: isDisabled })}
      onClick={onClick}
    >
      <FormattedMessage id={btnId} />
    </div>
  );
};

export default memo(ActionButton);
