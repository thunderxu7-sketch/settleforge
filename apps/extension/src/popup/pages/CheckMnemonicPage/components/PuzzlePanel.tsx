import {FC, memo} from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import styles from '../CheckMnemonicPage.m.scss';

interface Props {
  currentIndex: number;
  mnemonicsLength: number;
}

const PuzzlePanel: FC<Props> = ({ currentIndex, mnemonicsLength }) => {
  return (
    <>
      <div className={classNames(styles.checkMnemonicList, 'scroll')}>
        <div className={styles.checkMnemonicListWrap}>
          {[...Array(mnemonicsLength)].map((_i, index) => {
            return (
              <div
                key={index}
                className={classNames(styles.checkMnemonicItem, {
                  [styles.active]: index === currentIndex,
                })}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </div>
      <p className={styles.pageIntro}>
        <FormattedMessage id="WALLET.BACKUP.MNEMONIC.SELECT" values={{ index: currentIndex + 1 }} />
      </p>
    </>
  );
};

export default memo(PuzzlePanel);
