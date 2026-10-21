import { FC, ImgHTMLAttributes, memo, useEffect, useState } from 'react';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  defaultSrc: string;
}

const PreloadImage: FC<Props> = ({ defaultSrc, src, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState<string>(defaultSrc);

  useEffect(() => {
    if (!src) {
      return;
    }
    const image = new Image();
    image.onload = () => {
      setCurrentSrc(src);
    };
    image.src = src;
  }, [src]);

  return <img src={currentSrc} {...props} />;
};

export default memo(PreloadImage);
