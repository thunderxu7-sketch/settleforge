import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAssetsManagementBiz } from './hook';
import { useIntl } from 'react-intl';
import _ from 'lodash';

import NavBar from '../../../../components/NavBar/NavBar';
import HotTokens from './components/HotTokens';
import ResultTokens from './components/ResultTokens';

import styles from './TokensPage.m.scss';

const TokensPage = () => {
  const {
    clearHistory,
    state,
    setClearTokenModalVisible,
    setSearchValue,
    assetOperation,
    tronscanHost,
    goBack,
    onFollowAsset,
    cancelDeleteToken,
    confirmDeleteToken,
    searchHistoryKey,
    clearHistoryRef,
    updateResultTokens,
    setCurrentFilterType,
  } = useAssetsManagementBiz();
  const {
    historyTokens,
    hotTokens,
    searchResultTokens,
    clearTokenModalVisible,
    searchValue,
    deleteToken,
    historyRef,
    tokenDomList,
    showCustomEntry,
    resultContentVisible,
    currentFilterType,
  } = state;
  const location = useLocation();
  const { tokenSearchValue } = (location.state as any) ?? {};
  useEffect(() => {
    // change ref and search
    if (tokenSearchValue) return searchHistoryKey(tokenSearchValue);
  }, []);

  const { formatMessage } = useIntl();
  const searchInput: any = React.useRef();
  if (historyRef) searchInput.current.value = historyRef;

  const handleChange = _.debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    clearHistoryRef();

    setSearchValue(value.trim());
  }, 600);

  return (
    <div className={styles.tokensPage}>
      <NavBar
        onClickLeft={goBack}
        title={
          <div className={styles.searchInput}>
            <input
              placeholder={formatMessage({ id: 'ASSET.ADD_TOKEN.PLACEHOLDER' })}
              onChange={handleChange}
              className={searchValue ? styles.customPadding : ''}
              ref={searchInput}
            />
            {searchValue && (
              <span
                className={styles.clearInput}
                onClick={() => {
                  updateResultTokens([]);
                  searchInput.current.value = '';
                  searchHistoryKey('');
                }}
              ></span>
            )}
          </div>
        }
      />

      {searchValue?.length > 0 && resultContentVisible ? (
        <ResultTokens
          searchResultTokens={searchResultTokens}
          assetOperation={assetOperation}
          onFollowAsset={onFollowAsset}
          deleteToken={deleteToken}
          confirmDeleteToken={confirmDeleteToken}
          cancelDeleteToken={cancelDeleteToken}
          tronscanHost={tronscanHost}
          searchValue={searchValue}
          tokenDomList={tokenDomList}
          showCustomEntry={showCustomEntry}
          currentFilterType={currentFilterType}
          setCurrentFilterType={setCurrentFilterType}
        />
      ) : (
        <HotTokens
          clearHistory={clearHistory}
          historyTokens={historyTokens}
          hotTokens={hotTokens}
          clearTokenModalVisible={clearTokenModalVisible}
          setClearTokenModalVisible={setClearTokenModalVisible}
          assetOperation={assetOperation}
          tronscanHost={tronscanHost}
          onFollowAsset={onFollowAsset}
          deleteToken={deleteToken}
          confirmDeleteToken={confirmDeleteToken}
          cancelDeleteToken={cancelDeleteToken}
          searchHistoryKey={searchHistoryKey}
        />
      )}
    </div>
  );
};

export default TokensPage;
