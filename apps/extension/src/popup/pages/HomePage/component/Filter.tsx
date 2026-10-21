import { FC, memo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import type { FilterOptionsType } from '../hook';
import PAGES from '../../../../constants/pages';

import styles from '../HomePage.m.scss';

import IconClose from '../images/close3.svg';
import FilterIcon1 from '../images/filter_normal_1.svg';
import FilterIcon2 from '../images/filter_normal_2.svg';
import FilterIcon3 from '../images/filter_normal_3.svg';
import FilterIcon4 from '../images/filter_active_1.svg';
import FilterIcon5 from '../images/filter_active_2.svg';
import FilterIcon6 from '../images/filter_active_3.svg';

interface Props {
  setFilterVisible: (value: boolean) => void;
  setFilterOptions: (key: string, value: any) => void;
  filterOptions: FilterOptionsType;
  updateFilterImage: (filterImage: string) => void;
  filterImage: string;
}

const TokenFilter: FC<Props> = ({
  setFilterVisible,
  setFilterOptions,
  filterOptions,
  updateFilterImage,
  filterImage,
}) => {
  const intl = useIntl();
  const navigate = useNavigate();

  const { sortType = 2, hideSmallWorthAsset = false } = filterOptions;

  const clickSortByManual = useCallback(
    async (e: any) => {
      e.stopPropagation();
      setFilterOptions('sortType', 1);
      navigate(PAGES.PAGE_CUSTOM_SORT);
    },
    [navigate, setFilterOptions],
  );

  const onClose = useCallback(() => {
    setFilterVisible(false);
  }, [setFilterVisible]);

  const checkFilterImage = () => {
    let futureFilterImage = '';
    if (hideSmallWorthAsset) {
      if (filterImage === '21') futureFilterImage = '11';
      if (filterImage === '22') futureFilterImage = '12';
      if (filterImage === '23') futureFilterImage = '13';
    } else {
      if (filterImage === '11') futureFilterImage = '21';
      if (filterImage === '12') futureFilterImage = '22';
      if (filterImage === '13') futureFilterImage = '23';
    }
    updateFilterImage(futureFilterImage);
  };

  return (
    <div>
      <div className={styles.ftBoard} onClick={onClose}></div>
      <div className={styles.tokenFilter}>
        <img onClick={onClose} src={IconClose} className={styles.filterCloseIcon} />
        <div className={styles.tfTitle}>
          {intl.formatMessage({ id: 'ASSET.ASSET_MANAGE.TITLE_FILTER' })}
        </div>
        <div
          className={styles.tfList}
          onClick={() => {
            setFilterOptions('hideSmallWorthAsset', !hideSmallWorthAsset);
            checkFilterImage();
          }}
        >
          <div
            className={classNames(styles.checkBox, hideSmallWorthAsset ? styles.checked : '')}
          ></div>
          <div>{intl.formatMessage({ id: 'ASSET.MENU.HIDE_SMALL_BALANCES' })}</div>
        </div>
        <div className={styles.grayLine}></div>
        <div className={styles.tfTitle}>
          {intl.formatMessage({ id: 'ASSET.ASSET_MANAGE.TITLE_SORT' })}
        </div>
        <div
          className={classNames(styles.tfList, styles.flSp)}
          onClick={() => {
            setFilterOptions('sortType', 1);
            updateFilterImage(hideSmallWorthAsset ? '21' : '11');
          }}
        >
          <div className={classNames(styles.flLeft, styles.flAcent)}>
            <div
              className={classNames(styles.checkBox, sortType === 1 ? styles.checked : '')}
            ></div>
            <div>{intl.formatMessage({ id: 'ASSET.MENU.SORT_BY_PERFERENCE' })}</div>
          </div>
          <div className={styles.link} onClick={clickSortByManual}>
            {intl.formatMessage({ id: 'ASSET.MENU.SORT_BY_MANUAL' })}
          </div>
        </div>
        <div
          className={classNames(styles.tfList, styles.mt20)}
          onClick={() => {
            setFilterOptions('sortType', 2);
            updateFilterImage(hideSmallWorthAsset ? '22' : '12');
          }}
        >
          <div className={classNames(styles.checkBox, sortType === 2 ? styles.checked : '')}></div>
          <div>{intl.formatMessage({ id: 'ASSET.MENU.SORT_BY_VALUE' })}</div>
        </div>
        <div
          className={classNames(styles.tfList, styles.mt20)}
          onClick={() => {
            setFilterOptions('sortType', 3);
            updateFilterImage(hideSmallWorthAsset ? '23' : '13');
          }}
        >
          <div className={classNames(styles.checkBox, sortType === 3 ? styles.checked : '')}></div>
          <div>{intl.formatMessage({ id: 'ASSET.MENU.SORT_BY_NAME' })}</div>
        </div>
      </div>
    </div>
  );
};

export default memo(TokenFilter);
