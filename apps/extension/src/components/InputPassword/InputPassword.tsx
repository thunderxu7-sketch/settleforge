import { FC, memo, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';

import { Input } from 'antd';

import InputCriteria from '../InputCriteria';

import styles from './InputPassword.m.scss';

interface Props {
  isSamePassword?: boolean;
  password: string;
  confirmPassword?: string;
  changeState: (val: {
    password?: string;
    confirmPassword?: string;
    isValidPassword?: boolean;
    isSamePassword?: boolean;
  }) => void;
}

interface CheckPoint {
  [key: string]: any;
}

interface SamePasswordLabelProps {
  isSamePassword?: boolean;
  isKeepError: boolean;
}

const SamePasswordLabel: FC<SamePasswordLabelProps> = ({ isSamePassword, isKeepError }) => {
  if (isSamePassword) {
    return null;
  }
  if (isKeepError) {
    return <InputCriteria id="WALLT.IMPORT.SET_PASSWORD.ERROR" isValid={false} />;
  }
  if (isSamePassword == undefined) {
    return null;
  }
  if (!isSamePassword) {
    return <InputCriteria id="WALLT.IMPORT.SET_PASSWORD.ERROR" isValid={false} />;
  }
  return null;
};

const InputPassword: FC<Props> = ({ isSamePassword, password, confirmPassword, changeState }) => {
  const { formatMessage } = useIntl();
  const [checkPoint, setCheckPoint] = useState<CheckPoint>({});
  const [isKeepError, setKeepError] = useState<boolean>(false);

  useEffect(() => {
    setCheckPoint({
      upCase: {
        name: formatMessage({ id: 'WALLT.IMPORT.UPPER_CASE' }),
        status: false,
      },
      lowCase: {
        name: formatMessage({ id: 'WALLT.IMPORT.LOWER_CASE' }),
        status: false,
      },
      number: {
        name: formatMessage({ id: 'WALLT.IMPORT.NUM' }),
        status: false,
      },
      length: {
        name: formatMessage({ id: 'WALLT.IMPORT.EIGHT_BIT' }),
        status: false,
      },
    });
  }, []);

  useEffect(() => {
    let isValidPassword = true;
    const checkPoint = {
      upCase: {
        name: formatMessage({ id: 'WALLT.IMPORT.UPPER_CASE' }),
        status: false,
      },
      lowCase: {
        name: formatMessage({ id: 'WALLT.IMPORT.LOWER_CASE' }),
        status: false,
      },
      number: {
        name: formatMessage({ id: 'WALLT.IMPORT.NUM' }),
        status: false,
      },
      length: {
        name: formatMessage({ id: 'WALLT.IMPORT.EIGHT_BIT' }),
        status: false,
      },
    };

    const upCaseRegex = new RegExp(/[A-Z]+/g);
    if (upCaseRegex.test(password)) {
      checkPoint['upCase'].status = true;
    } else {
      isValidPassword = false;
    }

    const lowCaseRegex = new RegExp(/[a-z]+/g);
    if (lowCaseRegex.test(password)) {
      checkPoint['lowCase'].status = true;
    } else {
      isValidPassword = false;
    }

    const numberRegex = new RegExp(/[0-9]+/g);
    if (numberRegex.test(password)) {
      checkPoint['number'].status = true;
    } else {
      isValidPassword = false;
    }

    if (password.length >= 8) {
      checkPoint['length'].status = true;
    } else {
      isValidPassword = false;
    }

    let isSamePassword = undefined;
    if (password == '' && confirmPassword == '') {
      setKeepError(false);
    } else if (confirmPassword && confirmPassword != '') {
      isSamePassword = confirmPassword === password;
      setKeepError(true);
    }
    changeState({ isValidPassword, isSamePassword });
    setCheckPoint(checkPoint);
  }, [password]);

  useEffect(() => {
    let isSamePassword = undefined;
    if (password == '' && confirmPassword == '') {
      setKeepError(false);
    } else if (confirmPassword && confirmPassword != '') {
      isSamePassword = confirmPassword === password;
      setKeepError(true);
    }
    changeState({ isSamePassword });
  }, [confirmPassword]);

  const changePassword = (password: string) => {
    if (password.length > 32) {
      return;
    }
    changeState({ password });
  };

  const changeConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword.length > 32) {
      return;
    }
    changeState({ confirmPassword });
  };

  return (
    <div className={styles.inputPasswordArea}>
      <p>
        <FormattedMessage id="WALLT.IMPORT.PASSWORD" />
      </p>
      <p className={styles.passwordWarn}>
        <FormattedMessage id="WALLT.IMPORT.PASSWORD_TIP" />
      </p>
      <Input
        value={password}
        allowClear
        type="password"
        placeholder={formatMessage({ id: 'WALLT.IMPORT.SET_PASSWORD' })}
        onChange={(e) => changePassword(e.target.value)}
        onFocus={() => {
          changePassword('');
        }}
      />
      <ul className={styles.checkPointList}>
        {Object.keys(checkPoint).map((item, index) => {
          const { name, status } = checkPoint[item];
          return (
            <li className={styles.checkPointItem} key={index}>
              <p>
                <i className={classNames(styles.icon, { [styles.correct]: status })} />
                <span className={classNames(styles.checkPointName, status ? 'correct' : '')}>
                  {name}
                  {status}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
      <Input
        value={confirmPassword}
        allowClear
        type="password"
        placeholder={formatMessage({ id: 'WALLT.IMPORT.PASSWORD_AGAIN' })}
        onChange={(e) => changeConfirmPassword(e.target.value)}
        onFocus={() => {
          changeConfirmPassword('');
        }}
      />
      <SamePasswordLabel isSamePassword={isSamePassword} isKeepError={isKeepError} />
    </div>
  );
};

export default memo(InputPassword);
