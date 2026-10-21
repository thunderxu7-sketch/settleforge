import { FC, MouseEvent, useCallback, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import Zh from './components/Zh';
import Ja from './components/Ja';
import En from './components/En';

import iconImg from './images/link.svg';

import styles from './Privacy.m.scss';

interface Props {
  language: string;
  agreePrivacy: () => void;
  closePrivacyContent: (event: MouseEvent<HTMLDivElement>) => void;
}

const Privacy: FC<Props> = ({ language, agreePrivacy, closePrivacyContent }) => {
  const [hasRead, setHasRead] = useState(false);
  const scrollRef = useRef<any>(null);

  const onScrollHandle = useCallback(() => {
    const scrollTop = scrollRef.current.scrollTop;
    const clientHeight = scrollRef.current.clientHeight;
    const scrollHeight = scrollRef.current.scrollHeight;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasRead(true);
    }
  }, []);

  const agreeProto = useCallback(() => {
    if (hasRead) {
      agreePrivacy();
    }
  }, [hasRead, agreePrivacy]);

  const openPrivacyLink = useCallback(() => {
    const supportedLang = language;
    if (supportedLang === 'zh') {
      window.open('https://dapp.tronlink.org/#/useragreement');
    } else if (supportedLang === 'ja') {
      window.open('https://dapp.tronlink.org/docs/TronLink-jp.pdf');
    } else {
      window.open('https://dapp.tronlink.org/#/useragreementen');
    }
  }, [language]);

  const langCode = language;

  return (
    <>
      <div className={styles.bgLayer} />
      <div className={styles.pagePrivacy}>
        <div className={styles.pageHeader}>
          <div className={styles.back} onClick={closePrivacyContent} />
          <FormattedMessage id="WALLET.USER_PRIVACY" />
          <img className={styles.headerIcon} src={iconImg} onClick={openPrivacyLink} alt="" />
        </div>
        <div className={styles.privacyFrame} ref={scrollRef} onScrollCapture={onScrollHandle}>
          <div className={styles.privacyContent} style={{ height: '400px' }}>
            {langCode === 'zh' ? <Zh /> : langCode === 'ja' ? <Ja /> : <En />}
          </div>
        </div>
        <div
          className={classNames(styles.privacyBtn, { [styles.disabled]: !hasRead })}
          onClick={agreeProto}
        >
          <FormattedMessage id={hasRead ? 'WALLET.AGREE_BTN_2' : 'WALLET.AGREE_BTN'} />
        </div>
      </div>
    </>
  );
};

export default Privacy;
