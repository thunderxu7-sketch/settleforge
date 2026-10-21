import { FC, memo, useEffect, useRef } from 'react';

import styles from '../HomePage.m.scss';

interface Props {
  balanceStr: string;
}

const ResizableBalance: FC<Props> = ({ balanceStr }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ele = ref.current;
    if (!ele) {
      return;
    }

    let divWidth = ele.clientWidth;
    let scrollWidth = ele.scrollWidth;

    let fontSize = 24;
    while (scrollWidth > divWidth) {
      --fontSize;
      ele.style.fontSize = `${fontSize}px`;
      divWidth = ele.clientWidth;
      scrollWidth = ele.scrollWidth;
    }
  }, [balanceStr]);

  return (
    <div ref={ref} className={styles.trxBalanceUsd}>
      {balanceStr}
    </div>
  );
};

export default memo(ResizableBalance);
