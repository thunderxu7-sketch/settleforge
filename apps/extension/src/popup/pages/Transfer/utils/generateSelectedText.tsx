import _ from 'lodash';
import log from 'loglevel';

import styles from '../TransferStep2Page/TransferStep2Page.m.scss';

export function generateSelectedText(
  originText: string,
  tokenSearchKey: string,
  isAddress = false,
) {
  try {
    if (!originText || !tokenSearchKey) {
      return <span>{originText}</span>;
    }

    let result = <></>;
    const index = originText.toUpperCase().indexOf(tokenSearchKey.toUpperCase());

    if (index === -1) {
      result = <span>{originText}</span>;
    } else {
      if (isAddress) {
        result =
          originText.replace('ID:', '').trim() === tokenSearchKey ? (
            <span className={styles.search}>{originText}</span>
          ) : (
            <span>{originText}</span>
          );
      } else {
        result = (
          <div className={styles.searchWrap}>
            {originText.substring(0, index)}
            <span className={styles.search}>
              {originText.substring(index, index + tokenSearchKey.length)}
            </span>
            {originText.substring(index + tokenSearchKey.length, originText.length)}
          </div>
        );
      }
    }
    return result;
  } catch (error) {
    log.info('createShowAddress error', error);
  }
}
