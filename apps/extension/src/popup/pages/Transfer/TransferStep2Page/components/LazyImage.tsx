import { FC, memo, useState } from 'react';

import styles from '../TransferStep2Page.m.scss';

interface Props {
  defaultSrc: string;
  realSrc: string;
}
const LazyImage: FC<Props> = ({ defaultSrc, realSrc }) => {
  const [showDefault, setShowDefault] = useState(true);
  return (
    <div className={styles.lazyImage}>
      {showDefault ? <img src={defaultSrc} alt="" /> : ''}
      <img
        style={{ width: '100%', visibility: showDefault ? 'hidden' : 'visible' }}
        src={realSrc}
        onLoad={(e) => {
          setShowDefault(false);
        }}
        onError={() => {
          setShowDefault(true);
        }}
        alt=""
      />
    </div>
  );
};

export default memo(LazyImage);
