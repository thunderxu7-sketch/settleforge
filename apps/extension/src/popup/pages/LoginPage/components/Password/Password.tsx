import type { ChangeEvent, KeyboardEvent } from 'react';
import { FC, memo, useCallback, useReducer } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import styles from '../../LoginPage.m.scss';

import OpenedEyeIcon from '../../images/opened-eye.svg';
import ClosedEyeIcon from '../../images/closed-eye.svg';

interface Props extends Omit<React.HTMLProps<HTMLInputElement>, 'onChange'> {
  isDisabled?: boolean;
  onEnter?: () => void;
  placeholder?: string;
  onChangeText: (val: string) => void;
}

interface State {
  isPlaceHolderVisible: boolean;
  isPasswordHidden: boolean;
}

const initialState: State = {
  isPlaceHolderVisible: false,
  isPasswordHidden: true,
};

type Action =
  | {
      type: 'TOGGLE_PLACEHOLDER';
    }
  | {
      type: 'TOGGLE_PASSWORD';
    };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'TOGGLE_PLACEHOLDER':
      return {
        ...state,
        isPlaceHolderVisible: !state.isPlaceHolderVisible,
      };

    case 'TOGGLE_PASSWORD':
      return {
        ...state,
        isPasswordHidden: !state.isPasswordHidden,
      };
    default:
      return state;
  }
};

const Password: FC<Props> = ({
  isDisabled = false,
  value = '',
  className = '',
  onChangeText,
  onEnter,
  placeholder = '',
}) => {
  const intl = useIntl();

  const [state, dispatch] = useReducer(reducer, initialState);

  if (placeholder) {
    placeholder = intl.messages[placeholder] as string;
  }

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (isDisabled) {
        return;
      }

      const value = event.target.value;

      onChangeText(value);
    },
    [isDisabled, onChangeText],
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

  const togglePlaceHolderVisible = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLACEHOLDER' });
  }, []);

  const togglePasswordVisible = useCallback(() => {
    dispatch({ type: 'TOGGLE_PASSWORD' });
  }, []);

  return (
    <div className={classNames(styles.passwordContainer, className)}>
      <div className={styles.placeHolderContainer}>
        {(state.isPlaceHolderVisible || value != '') && placeholder}
      </div>
      <div className={styles.inputWrapper}>
        <input
          autoFocus={true}
          placeholder={placeholder}
          type={state.isPasswordHidden ? 'password' : 'text'}
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={togglePlaceHolderVisible}
          onBlur={togglePlaceHolderVisible}
          readOnly={isDisabled}
        />

        <img
          onClick={togglePasswordVisible}
          src={state.isPasswordHidden ? ClosedEyeIcon : OpenedEyeIcon}
          className={styles.eye}
          alt=""
        />
      </div>
    </div>
  );
};

export default memo(Password);
