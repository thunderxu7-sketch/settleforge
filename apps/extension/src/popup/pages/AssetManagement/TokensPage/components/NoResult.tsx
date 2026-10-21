import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';
// @ts-ignore
import TronWeb from 'tronweb';
import log from 'loglevel';
import _ from 'lodash';

import PAGES from '../../../../../constants/pages';

import noResult from '../images/no_result.svg';

import styles from '../TokensPage.m.scss';

interface Props {
  showCustomEntry: boolean;

  searchValue: string;
}

const NoResult: FC<Props> = ({ showCustomEntry, searchValue }) => {
  const navigator = useNavigate();

  let isInvalidAddress = false;
  try {
    if (
      searchValue.startsWith('T') &&
      /^[a-z0-9]+$/i.test(searchValue) &&
      _.size(searchValue) > 33 &&
      !TronWeb.isAddress(searchValue)
    ) {
      isInvalidAddress = true;
    }
  } catch (e) {
    log.info(e);
  }

  return (
    <div className={styles.noResult}>
      <img src={noResult} alt="" className={styles.img} />
      {showCustomEntry ? (
        <div className={styles.customContainer}>
          <FormattedMessage id="ASSET.SEARCH.NOT_FIND_CUSTOM" />
          <div className={styles.customEntry}>
            <button
              onClick={() =>
                navigator(PAGES.PAGE_ASSETS_MANAGEMENT_CUSTOM, {
                  state: { searchKey: searchValue },
                })
              }
            >
              <FormattedMessage id="BUTTON.ADD_CUSTOM_TOKEN" />
            </button>
          </div>
        </div>
      ) : (
        <FormattedMessage
          id={isInvalidAddress ? 'ASSET.SEARCH.ADDRESS.INVALID' : 'ASSET.SEARCH.NOT_FIND'}
        />
      )}
    </div>
  );
};

export default memo(NoResult);
