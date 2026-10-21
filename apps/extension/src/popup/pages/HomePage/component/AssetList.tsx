import { FC, memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router';
import classNames from 'classnames';

import type { FilterOptionsType } from '../hook';
import HomeAssetItem from './AssetItem';
import PAGES from '../../../../constants/pages';
import { AssetType } from '../../../../constants/types';

import styles from '../HomePage.m.scss';

import FilterIcon from '../images/filter_normal_1.svg';
import AddIcon from '../images/add.svg';
import MagnifierIcon from '../images/magnifier.svg';

import FilterIcon1 from '../images/filter_normal_1.svg';
import FilterIcon2 from '../images/filter_normal_2.svg';
import FilterIcon3 from '../images/filter_normal_3.svg';
import FilterIcon4 from '../images/filter_active_1.svg';
import FilterIcon5 from '../images/filter_active_2.svg';
import FilterIcon6 from '../images/filter_active_3.svg';

const fiList: any = {
  '11': FilterIcon1,
  '12': FilterIcon2,
  '13': FilterIcon3,
  '21': FilterIcon4,
  '22': FilterIcon5,
  '23': FilterIcon6,
};

interface Props {
  setFilterVisible: (name: boolean) => void;
  homeAsset: AssetType;
  homeCollection: AssetType;
  tabIndex: 0 | 1;
  clearVisible: boolean;
  tokenSearchValue: string;
  fieldFound: boolean;
  tokenDomList: any;
  tokenDataList: any;
  tokenSearchOnChange: (value: string) => void;
  changeTab: (tabIndex: 0 | 1) => void;
  clearInputValue: () => void;
  balanceVisible: boolean;
  isSearchBarVisible: boolean;
  onToggleSearchBar: () => void;
  filterImage: string;
  filterOptions: FilterOptionsType;
}

const HomePageAssetList: FC<Props> = ({
  setFilterVisible,
  homeAsset,
  homeCollection,
  tabIndex,
  clearVisible,
  tokenSearchValue,
  fieldFound,
  tokenDomList,
  tokenSearchOnChange,
  changeTab,
  clearInputValue,
  balanceVisible,
  isSearchBarVisible,
  onToggleSearchBar,
  filterImage,
  filterOptions,
}) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const { hideSmallWorthAsset = false, sortType } = filterOptions;

  const goToAssetManagement = useCallback(() => {
    navigate(PAGES.PAGE_ASSETS_MANAGEMENT_MY_ASSETS);
  }, [navigate]);

  const asset = tabIndex === 0 ? homeAsset : homeCollection;

  const navigatorToMyAssetManagement = useCallback(() => {
    navigate(PAGES.PAGE_ASSETS_MANAGEMENT_MY_ASSETS);
  }, [navigate]);

  const navigatorAssetManagementTokens = useCallback(() => {
    navigate(PAGES.PAGE_ASSETS_MANAGEMENT_TOKENS, { state: { tokenSearchValue } });
  }, [navigate, tokenSearchValue]);

  let assetsCount = asset.length;
  if (tokenSearchValue) {
    assetsCount = asset.filter((e, index) => {
      return tokenDomList[index]?.found;
    }).length;
  }
  return (
    <div className={classNames(styles.assetContent, 'paddingLR16')}>
      <div className={styles.flSp}>
        <div>
          <span
            className={tabIndex === 0 ? styles.activeTab : styles.normalTab}
            onClick={() => changeTab(0)}
          >
            {formatMessage({ id: 'ASSET.ASSET' })}
          </span>
          <span
            className={tabIndex === 1 ? styles.activeTab : styles.normalTab}
            onClick={() => changeTab(1)}
          >
            <FormattedMessage id="ASSET.COLLECTION" />
          </span>
        </div>

        <div className={styles.rightPart}>
          {isSearchBarVisible && (
            <div
              className={styles.searchTokenBox}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <img className={styles.icon} src={MagnifierIcon} alt="" />

              <div className={styles.inputWrapper}>
                <input
                  autoFocus={true}
                  className={styles.searchTokenInput}
                  type="text"
                  placeholder={formatMessage({ id: 'ASSET.SEARCH.TOKEN' })}
                  onChange={(e) => tokenSearchOnChange(e.target.value)}
                  value={tokenSearchValue}
                />
              </div>
              {clearVisible && <div className={styles.clearIcon} onClick={clearInputValue}></div>}
            </div>
          )}
          <div className={styles.icons}>
            {!isSearchBarVisible && (
              <img className={styles.icon} src={MagnifierIcon} alt="" onClick={onToggleSearchBar} />
            )}

            <img
              className={styles.icon}
              src={
                fiList[filterImage] ||
                (sortType === 1
                  ? hideSmallWorthAsset
                    ? FilterIcon4
                    : FilterIcon1
                  : sortType === 3
                  ? hideSmallWorthAsset
                    ? FilterIcon6
                    : FilterIcon3
                  : hideSmallWorthAsset
                  ? FilterIcon5
                  : FilterIcon2)
              }
              alt=""
              onClick={() => setFilterVisible(true)}
            />
            <img className={styles.icon} src={AddIcon} alt="" onClick={goToAssetManagement} />
          </div>
        </div>
      </div>

      <div
        className={classNames(
          styles.assetList,
          'scroll',
          // asset.length === 4 ? styles.limitHeight : '',
        )}
      >
        {asset.map((item: any, index: number) => {
          return (
            (tokenDomList[index]?.found || !tokenSearchValue) && (
              <HomeAssetItem
                token={item}
                key={index}
                balanceVisible={balanceVisible}
                tokenDomList={tokenDomList[index]}
              />
            )
          );
        })}

        {!tokenSearchValue && asset.length > 4 && (
          <div className={styles.viewAssetTip}>
            <span>{formatMessage({ id: 'ASSET.HOME.NOT_FIND_ASSET' })} </span>
            <span className={styles.link} onClick={navigatorToMyAssetManagement}>
              {formatMessage({ id: 'ASSET.HOME.ASSET_MANAGE_S' })}
            </span>
          </div>
        )}

        {assetsCount == 0 && tokenSearchValue && (
          <div className={styles.tokenNotFound}>
            <div>{formatMessage({ id: 'ASSET.SEARCH.NO_RECORDS' })}</div>
            <div className={styles.link} onClick={navigatorAssetManagementTokens}>
              {formatMessage({ id: 'ASSET.SEARCH.VIEW_ALL' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(HomePageAssetList);
