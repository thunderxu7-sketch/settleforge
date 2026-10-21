import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { useWatchAssetBiz } from './hook';
import TokenItem from './components/TokenItem';
import { WindowType } from '../../../constants/types';

import styles from './WatchAsset.m.scss';

export interface WatchAssetPageProps {
  windowType: WindowType;
}

const WatchAsset = ({ windowType }: WatchAssetPageProps) => {
  const { state, pricesInfo, addWatchAsset, isDisable } = useWatchAssetBiz(windowType);
  const { tokens, isFailed, hostname } = state;

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <FormattedMessage id="DETECT_NEW_TOKEN.TITLE" />
      </div>
      <div className={styles.desc}>
        <FormattedMessage id="DETECT_NEW_TOKEN.TIPS" />
      </div>

      {tokens.map((tokenItem, index) => (
        <TokenItem key={index} tokenItem={tokenItem} pricesInfo={pricesInfo} hostname={hostname} />
      ))}

      {isFailed && (
        <div className={styles.failTip}>
          <FormattedMessage id={'DETECT_NEW_TOKEN.TIP.ADDRESS_CHECK'} />
        </div>
      )}

      <div className={styles.buttonsContainer}>
        <button
          onClick={() => addWatchAsset(tokens)}
          className={classNames(styles.confirmButton, { [styles.isDisable]: isDisable })}
          disabled={isDisable}
        >
          <FormattedMessage id="DETECT_NEW_TOKEN.BUTTON.ADD" />
        </button>

        <div onClick={() => addWatchAsset()} className={styles.cancelButton}>
          <FormattedMessage id="DETECT_NEW_TOKEN.BUTTON.CANCEL" />
        </div>
      </div>
    </div>
  );
};

export default WatchAsset;
