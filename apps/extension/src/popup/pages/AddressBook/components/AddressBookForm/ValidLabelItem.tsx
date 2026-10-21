import { FC } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';

import Toast from '../../../../../components/Toast';
import { Label } from './hook';

import styles from './AddressBookForm.m.scss';

interface Props {
  label: Label;
  onChange: (value: string) => void;
}

const ValidLabelItem: FC<Props> = ({ label, onChange }) => {
  const { formatMessage } = useIntl();
  const { name, value, type, state, maxLength, placeholder } = label;

  return (
    <div className={styles.label}>
      <label>
        <FormattedMessage id={name} />:
      </label>
      <div className={styles.input}>
        <input
          type="text"
          placeholder={formatMessage({ id: placeholder })}
          defaultValue={value}
          maxLength={maxLength}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
        {type === 'address' &&
          (value ? (
            <span
              className={styles.copy}
              onClick={async (e) => {
                Toast.show({
                  icon: 'success',
                  content: formatMessage({ id: 'TOAST.COPY' }),
                });
                await window.navigator.clipboard.writeText(value);
              }}
            >
              <FormattedMessage id="SETTING.TITLE.ADDRESS_BOOK.COPY" />
            </span>
          ) : (
            <span className={classNames(styles.copy, styles.disabled)}>
              <FormattedMessage id="SETTING.TITLE.ADDRESS_BOOK.COPY" />
            </span>
          ))}
      </div>
      {state !== '' ? (
        <div className={styles.tipError}>
          <FormattedMessage id={state} />
        </div>
      ) : null}
    </div>
  );
};

export default ValidLabelItem;
