import { FC, memo } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import SearchIcon from '../../../../../static/images/ic_search.svg';

import styles from '../MyAssetsPage.m.scss';

interface Props {
  onFocus: () => void;
}

const SearchInput: FC<Props> = ({ onFocus }) => {
  const { formatMessage } = useIntl();

  return (
    <div className={classNames(styles.searchWrap, 'marginLR16')}>
      <div className={styles.inputArea}>
        <img className={styles.searchIcon} src={SearchIcon} alt="" />
        <input
          type="text"
          onFocus={onFocus}
          title={formatMessage({ id: 'ASSET.ADD_TOKEN.PLACEHOLDER2' })}
          placeholder={formatMessage({ id: 'ASSET.ADD_TOKEN.PLACEHOLDER2' })}
        />
      </div>
    </div>
  );
};

export default memo(SearchInput);
