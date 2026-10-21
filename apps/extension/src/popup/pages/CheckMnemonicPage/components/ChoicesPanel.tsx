import { FC, memo } from 'react';
import classNames from 'classnames';

import styles from '../CheckMnemonicPage.m.scss';

interface Props {
  mnemonicChoices: string[];
  selectedIndex: number;
  onSelect: (value: number) => void;
}

const ChoicesPanel: FC<Props> = ({ mnemonicChoices, selectedIndex, onSelect }) => {
  return (
    <div className={styles.selectMnemonicList}>
      {mnemonicChoices.map((item, index) => {
        return (
          <div
            key={item}
            className={classNames(styles.selectMnemonicItem, {
              [styles.active]: index === selectedIndex,
            })}
            onClick={() => onSelect(index)}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
};

export default memo(ChoicesPanel);
