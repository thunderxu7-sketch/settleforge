import { FC, memo, useEffect, useRef } from 'react';

import styles from './ResizableText.m.scss';
import classNames from 'classnames';

interface Props {
  initSize: number;
  text: string;
  className?: string;
}

const ResizableText: FC<Props> = ({ initSize, text, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ele = ref.current;
    if (!ele) {
      return;
    }

    let divWidth = ele.clientWidth;
    let scrollWidth = ele.scrollWidth;

    let fontSize = initSize;
    while (scrollWidth > divWidth && fontSize > 12) {
      --fontSize;
      ele.style.fontSize = `${fontSize}px`;
      divWidth = ele.clientWidth;
      scrollWidth = ele.scrollWidth;
    }
  }, [text]);

  return (
    <span ref={ref} className={classNames(styles.resizableText, className)}>
      {text}
    </span>
  );
};

export default memo(ResizableText);
