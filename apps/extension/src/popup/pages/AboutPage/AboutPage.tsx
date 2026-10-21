import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import NavBar from '../../../components/NavBar/NavBar';
import { useSaveLatestLocation } from '../../../hooks/location';
import packageConfig from '../../../../package.json';
import { useSelectedLanguage } from '../../../hooks/language';

import styles from './AboutPage.m.scss';

interface RowType {
  id: string;
  url: string;
  urlEn: string;
  urlJp: string;
}

const rowList: RowType[] = [
  {
    id: 'SETTING.ABOUT.PRIVACY',
    url: 'https://dapp.tronlink.org/#/useragreement',
    urlEn: 'https://dapp.tronlink.org/#/useragreementen',
    urlJp: 'https://dapp.tronlink.org/docs/TronLink-jp.pdf',
  },
  {
    id: 'SETTING.ABOUT.AUDIT',
    url: 'https://www.tronlink.org/home/Chrome_Penetration_Report.pdf',
    urlEn: 'https://www.tronlink.org/home/Chrome_Penetration_Report.pdf',
    urlJp: 'https://www.tronlink.org/home/Chrome_Penetration_Report.pdf',
  },
  {
    id: 'SETTING.ABOUT.VISIT_WEBSITE',
    url: 'https://www.tronlink.org/cn/',
    urlEn: 'https://www.tronlink.org',
    urlJp: 'https://www.tronlink.org',
  },
  {
    id: 'SETTING.ABOUT.VISIT_SUPPORT',
    url: 'https://support.tronlink.org/hc/zh-cn',
    urlEn: 'https://support.tronlink.org/hc/en-us',
    urlJp: 'https://support.tronlink.org/hc/en-us',
  },
  {
    id: 'SETTING.ABOUT.CONTACT',
    url: 'https://support.tronlink.org/hc/zh-cn/requests/new',
    urlEn: 'https://support.tronlink.org/hc/en-us/requests/new',
    urlJp: 'https://support.tronlink.org/hc/en-us/requests/new',
  },
];

const AboutPage = () => {
  useSaveLatestLocation();

  const { langAbbr } = useSelectedLanguage();

  const onClickRow = useCallback(
    (row: RowType) => {
      if (langAbbr === 'zh') {
        window.open(row.url);
      } else if (langAbbr === 'ja') {
        window.open(row.urlJp);
      } else {
        window.open(row.urlEn);
      }
    },
    [langAbbr],
  );

  return (
    <>
      <NavBar title="SETTING.TITLE.ABOUT" />

      <div className={styles.aboutUs}>
        <div className={styles.logoWrap}>
          <div className={styles.logoBig}></div>
          <div className={styles.logoSmall}></div>
          <div className={styles.version}>
            <FormattedMessage
              id="SETTING.ABOUT.VERSION"
              values={{
                version: packageConfig.version,
              }}
            />
          </div>
        </div>
        <div className={styles.listWrap}>
          {rowList.map((row) => {
            return (
              <div key={row.id} className={styles.item} onClick={() => onClickRow(row)}>
                <FormattedMessage id={row.id} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AboutPage;
