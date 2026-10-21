import { FormattedMessage } from 'react-intl';
import { Select } from 'antd';

import Privacy from './components/Privacy';
import { useGuideBiz } from './hook';

import styles from './Guide.m.scss';

import guideImg from './images/bg.png';
import IconArrow01 from './images/arrow01.svg';
import IconArrow02 from './images/arrow02.svg';
import IconDropdown from './images/icon-dropdown.svg';

const { Option } = Select;

const GuidePage = () => {
  const {
    langCode,
    isPrivacyVisible,
    changeLang,
    pageJumpAction,
    agreePrivacy,
    closePrivacyContent,
    openLedgerGuidePage,
  } = useGuideBiz();

  if (isPrivacyVisible) {
    return (
      <Privacy
        closePrivacyContent={closePrivacyContent}
        agreePrivacy={agreePrivacy}
        language={langCode}
      />
    );
  }

  return (
    <div className={styles.pageGuide}>
      <div className={styles.guideSelect}>
        <Select
          defaultValue={langCode}
          style={{ width: 70, height: 22, textAlign: 'center' }}
          onChange={changeLang}
          dropdownClassName={styles.guideDropdown}
          suffixIcon={<img src={IconDropdown} />}
        >
          <Option value="zh">中文</Option>
          <Option value="en">English</Option>
          <Option value="ja">日本語</Option>
        </Select>
      </div>

      <div className={styles.guideImgBox}>
        <img className={styles.guideImg} src={guideImg} alt="" />
      </div>

      <div className={styles.guideDes}>
        <FormattedMessage id="GUIDE.DES_1" />
      </div>

      <div className={styles.guideText}>
        <FormattedMessage id="GUIDE.DES_2" />
      </div>

      <div
        className={styles.createButton}
        onClick={() => {
          pageJumpAction('create');
        }}
      >
        <span>
          <FormattedMessage id="GUIDE.CREATE_WALLET" />
        </span>
        <img src={IconArrow02} alt="" />
      </div>

      <div
        className={styles.importButton}
        onClick={() => {
          pageJumpAction('import');
        }}
      >
        <span>
          <FormattedMessage id="GUIDE.IMPORT_WALLET" />
        </span>
        <img src={IconArrow01} alt="" />
      </div>

      <p className={styles.guideFooter}>
        <FormattedMessage id="GUIDE.FOOTER_1" />{' '}
        <a
          onClick={(event) => {
            event.preventDefault();
            openLedgerGuidePage();
          }}
        >
          <FormattedMessage id="GUIDE.FOOTER_2" />
        </a>
      </p>
    </div>
  );
};

export default GuidePage;
