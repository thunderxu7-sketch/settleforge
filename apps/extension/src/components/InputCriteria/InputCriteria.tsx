import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import styles from './InputCriteria.m.scss';

const InputCriteria = ({ isValid = false, id }: { isValid?: boolean | undefined; id: any }) => {
  return (
    <div
      className={classNames(
        styles.inputCriteria,
        { [styles.isValid]: isValid },
        { [styles.isInvalid]: !isValid },
      )}
    >
      <FormattedMessage id={id} />
    </div>
  );
};

export default InputCriteria;
