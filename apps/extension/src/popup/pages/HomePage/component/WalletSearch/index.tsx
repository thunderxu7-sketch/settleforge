import { FC, memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';

import WalletCard from '../WalletCard';
import type { FuncCheckAndShowRemindModal } from '../../../../../components/RemindModal';

import styles from './WalletSearch.m.scss';

import NoResultImage from '../../images/no-result.svg';

interface Props {
  onChangeWalletSearch: (address: string) => void;
  onClickWalletCard: (address: string) => void;
  setWalletSearchVisible: (address: boolean) => void;
  walletSearchValue: string;
  walletSearchResult: any;
  checkAndShowRemindModal: FuncCheckAndShowRemindModal;
}

const WalletSearch: FC<Props> = ({
  onChangeWalletSearch,
  walletSearchResult,
  onClickWalletCard,
  walletSearchValue,
  setWalletSearchVisible,
  checkAndShowRemindModal,
}) => {
  const { formatMessage } = useIntl();

  const onCancel = useCallback(() => {
    onChangeWalletSearch('');
    setWalletSearchVisible(false);
  }, [onChangeWalletSearch, setWalletSearchVisible]);

  return (
    <div className={classNames(styles.walletSearchContainer)}>
      <div className={styles.inputBoxWrap}>
        <div className={styles.inputBox}>
          <input
            autoFocus={true}
            type="text"
            placeholder={formatMessage({ id: 'SETTING.TITLE.ADDRESS_BOOK.SEARCH' })}
            onChange={(e) => onChangeWalletSearch(e.target.value)}
            value={walletSearchValue}
          />
          <span className={styles.searchIcon}></span>
          {walletSearchValue && (
            <span className={styles.clearInput} onClick={() => onChangeWalletSearch('')}></span>
          )}
        </div>
        <div className={styles.cancelBtn} onClick={onCancel}>
          <FormattedMessage id="BUTTON.CANCEL" />
        </div>
      </div>
      <div className={styles.searchResult}>
        {walletSearchResult?.length > 0 ? (
          <WalletCard
            type={'result'}
            data={walletSearchResult}
            title={formatMessage({ id: 'ASSET.SEARCH.RESULT' })}
            onClickWalletCard={onClickWalletCard}
            walletSearchValue={walletSearchValue}
            checkAndShowRemindModal={checkAndShowRemindModal}
          />
        ) : (
          // more than 1 start to search and show results
          walletSearchValue?.length > 0 && (
            <div className={styles.searchNoResult}>
              <img src={NoResultImage} alt="" />
              <span className={styles.noResultText}>
                {formatMessage({ id: 'ACCOUNT.SEARCH.NO_RESULT' })}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default memo(WalletSearch);
