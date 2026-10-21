import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import styles from './Button.m.scss';

interface Props extends React.HTMLProps<HTMLButtonElement> {
  id: string;
  type?: 'primary' | 'secondary' | 'success' | 'danger' | 'white';
  isLoading?: boolean;
  isValid?: boolean;
}

const typeClazzMapping = {
  primary: styles.primary,
  secondary: styles.secondary,
  success: styles.success,
  danger: styles.danger,
  white: styles.white,
};

const Button: FC<Props> = ({
  type = 'primary',
  isLoading = false,
  isValid = true,
  onClick,
  id,
  className,
}) => {
  const isTrulyValid = isValid && !isLoading;

  return (
    <button
      className={classNames(styles.customButton, typeClazzMapping[type], className, {
        'is-valid': isTrulyValid,
        'is-invalid': !isTrulyValid,
        'is-loading': isLoading,
      })}
      onClick={isTrulyValid ? onClick : undefined}
    >
      <FormattedMessage id={id} /> {isLoading && <i className={styles.loadingIcon}></i>}
    </button>
  );
};

export default Button;
