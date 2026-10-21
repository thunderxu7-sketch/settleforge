import type { ReactNode } from 'react';
import { FC, memo, useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';
import classNames from 'classnames';

import IconBack from './images/icon_back.svg';

import styles from './NavBar.m.scss';

interface Props {
  title: string | ReactNode;
  leftElement?: ReactNode;
  onClickLeft?: () => void;
  rightElement?: ReactNode;
  onBackCustomExtraHandle?: () => void;
}

const NavBar: FC<Props> = ({
  title,
  leftElement,
  rightElement,
  onClickLeft,
  onBackCustomExtraHandle,
}) => {
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    onBackCustomExtraHandle?.();
    navigate(-1);
  }, [navigate]);

  let titleNode = title;
  if (typeof title == 'string') {
    titleNode = (
      <div className={styles.title}>
        <FormattedMessage id={title} />
      </div>
    );
  }

  const leftNode = useMemo(() => {
    if (leftElement) {
      return leftElement;
    }
    return (
      <img src={IconBack} className={styles.backIcon} onClick={onClickLeft || goBack} alt="" />
    );
  }, [leftElement, onClickLeft, goBack]);

  return (
    <div className={classNames(styles.container, 'marginLR16')}>
      <div className={styles.leftBox}>
        {leftNode}
        {titleNode}
      </div>
      <div className={styles.rightBox}>{rightElement}</div>
    </div>
  );
};

export default memo(NavBar);
