import { Tooltip } from 'antd';
import { FormattedMessage, useIntl } from 'react-intl';
import _ from 'lodash';

import Button from '../../../components/Button';
import PuzzlePanel from './components/PuzzlePanel';
import ChoicesPanel from './components/ChoicesPanel';
import NavBar from '../../../components/NavBar/NavBar';
import { useSelectedLanguage } from '../../../hooks/language';

import { useCheckMnemonicBiz } from './hook';

import styles from './CheckMnemonicPage.m.scss';
import classNames from 'classnames';
import { toolTipsOverlayInnerStyle } from '../../../constants/style_object';

const CheckMnemonicPage = () => {
  const { formatMessage } = useIntl();
  const { state, checkAnswer, lookAgain, onSelect } = useCheckMnemonicBiz();

  const { passArr, currentIndex, selectedIndex, mnemonicChoices, mnemonics } = state;

  const { langAbbr } = useSelectedLanguage();

  const Title = () => {
    return (
      <div className={classNames(styles.title, { [styles.jp]: langAbbr == 'ja' })}>
        <FormattedMessage id="WALLET.BACKUP.MNEMONIC.TITLE" />
      </div>
    );
  };

  const ReviewMnemonic = () => {
    if (langAbbr == 'ja') {
      return (
        <Tooltip
          placement="bottomRight"
          overlayInnerStyle={toolTipsOverlayInnerStyle}
          title={formatMessage({
            id: 'WALLET.BACKUP.MNEMONIC.RE_LOOK',
          })}
        >
          <div
            className={classNames(styles.reviewMnemonic, { [styles.jp]: langAbbr == 'ja' })}
            onClick={lookAgain}
          >
            <FormattedMessage id="WALLET.BACKUP.MNEMONIC.RE_LOOK" />
          </div>
        </Tooltip>
      );
    }
    return (
      <div className={styles.reviewMnemonic} onClick={lookAgain}>
        <FormattedMessage id="WALLET.BACKUP.MNEMONIC.RE_LOOK" />
      </div>
    );
  };

  return (
    <div className={styles.checkMnemonicContainer}>
      <NavBar title={<Title />} rightElement={<ReviewMnemonic />} />

      <div className={styles.checkMnemonicContent}>
        <p className={styles.pageIntro}>
          <FormattedMessage id="WALLET.BACKUP.MNEMONIC.CHECK" /> ({_.size(passArr) + 1}/3)
        </p>

        <PuzzlePanel currentIndex={currentIndex} mnemonicsLength={mnemonics.length} />

        <ChoicesPanel
          selectedIndex={selectedIndex}
          mnemonicChoices={mnemonicChoices}
          onSelect={onSelect}
        />

        <Button
          id={_.size(passArr) >= 2 ? 'BUTTON.FINISH' : 'BUTTON.NEXT_STEP'}
          isValid={selectedIndex !== null && _.size(passArr) < 3}
          className={styles.customButton}
          onClick={checkAnswer}
        />
      </div>
    </div>
  );
};

export default CheckMnemonicPage;
