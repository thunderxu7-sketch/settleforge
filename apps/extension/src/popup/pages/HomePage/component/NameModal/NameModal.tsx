import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';

import { useUpdateName } from './hook';

import styles from './NameModal.m.scss';

import isValidImg from '../../images/name_correct.svg';
import isInvalidImg from '../../images/name_wrong.svg';

interface Props {
  visible: boolean;
  toggleVisible: () => void;
  selectedAccount: any;
}

interface InputCriteriaProps {
  isValid: boolean;
  id: string;
}

const InputCriteria: FC<InputCriteriaProps> = ({ isValid = false, id }) => {
  return (
    <div className={classNames(styles.inputCriteria, isValid ? styles.isValid : styles.isInvalid)}>
      <span className={styles.statusIcon}>
        <img src={isValid ? isValidImg : isInvalidImg} alt="" />
      </span>
      <FormattedMessage id={id} values={{ strong: (value: any) => <strong>{value}</strong> }} />
    </div>
  );
};

const NameModal: FC<Props> = ({ visible, toggleVisible, selectedAccount }) => {
  const { formatMessage } = useIntl();

  const { accountName, isCriteria, onChangeName, hasLength, isUnique, submit, cancel } =
    useUpdateName(selectedAccount, toggleVisible);

  return visible ? (
    <div className={styles.modalWrap}>
      <div className={styles.modal}>
        <div className={styles.title}>
          <FormattedMessage id={'MENU.UPDATE_NAME'} />
        </div>
        <div className={styles.input}>
          <input
            type="text"
            placeholder={formatMessage({ id: 'INPUT.ACCOUNT_NEW_NAME' })}
            onChange={onChangeName}
            value={accountName}
            className={classNames(styles.hover)}
            tabIndex={1}
            maxLength={14}
          />
        </div>
        {isCriteria && (
          <div className={styles.criteria}>
            <InputCriteria id="WALLET.NAME.LENGTH_RULE" isValid={hasLength} />
            <InputCriteria id="CREATION_CRITERIA.IS_UNIQUE" isValid={isUnique} />
          </div>
        )}
        <div className={styles.btnGroup}>
          <button className={styles.cancel} onClick={cancel}>
            <FormattedMessage id={'BUTTON.CANCEL'} />
          </button>
          {hasLength && isUnique ? (
            <button className={styles.confirm} onClick={submit}>
              <FormattedMessage id={'BUTTON.FINISH'} />
            </button>
          ) : (
            <button className={styles.disabled}>
              <FormattedMessage id={'BUTTON.FINISH'} />
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;
};

export default memo(NameModal);
