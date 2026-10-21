import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { FC, memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconName } from '@fortawesome/fontawesome-svg-core';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import styles from './Input.m.scss';

type StatusType = 'no-state' | 'is-invalid' | 'is-valid';

interface Props extends Omit<React.HTMLProps<HTMLInputElement>, 'onChange'> {
  icon?: IconName;
  status?: StatusType;
  isDisabled?: boolean;
  onEnter?: () => void;
  validator?: {
    test: (value: string) => boolean;
  };
  placeholder?: string;
  onChangeText: (val: string) => void;
}

const Input: FC<Props> = ({
  icon,
  status,
  isDisabled = false,
  type = 'text',
  value = '',
  className = '',
  onChangeText,
  onEnter,
  onFocus,
  validator,
  placeholder = '',
}) => {
  const intl = useIntl();

  if (placeholder) {
    placeholder = intl.messages[placeholder] as string;
  }

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (isDisabled) {
        return;
      }

      const value = event.target.value;
      if (validator && !validator.test(value)) {
        return;
      }

      onChangeText(value);
    },
    [isDisabled, validator, onChangeText],
  );

  const handleKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (isDisabled || !onEnter) {
        return;
      }
      if (event.key === 'Enter') {
        onEnter();
      }
    },
    [isDisabled, onEnter],
  );

  const focusHandler = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (isDisabled || !onFocus) {
        return;
      }
      onFocus(event);
    },
    [isDisabled, onFocus],
  );

  const hasIcon = !!icon;
  const hasStatus = !!status;

  let statusIcon: IconName | null = null;
  if (status == 'is-valid') {
    statusIcon = 'check-circle';
  } else if (status == 'is-invalid') {
    statusIcon = 'times-circle';
  }

  return (
    <div className={classNames(styles.customInput, className)}>
      {hasIcon && <FontAwesomeIcon icon={icon} className={styles.inputIcon} />}

      <input
        className={classNames({
          [styles.hasIcon]: hasIcon,
          [styles.hasStatus]: hasStatus,
        })}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        onFocus={focusHandler}
        readOnly={isDisabled}
      />

      {!!status && (
        <div className={styles.inputStatus}>
          {statusIcon ? <FontAwesomeIcon icon={statusIcon} className={status} /> : ''}
        </div>
      )}
    </div>
  );
};

export default memo(Input);
