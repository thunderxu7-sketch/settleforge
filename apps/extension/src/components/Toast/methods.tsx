import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import assign from 'lodash/assign';
import assignWith from 'lodash/assignWith';
import isUndefined from 'lodash/isUndefined';

import { InternalToast, ToastProps } from './Toast';

const containers = [] as HTMLDivElement[];

function unmount(container: HTMLDivElement) {
  const unmountResult = ReactDOM.unmountComponentAtNode(container);
  if (unmountResult && container.parentNode) {
    container.parentNode.removeChild(container);
  }
}

export type ToastShowProps = Omit<ToastProps, 'visible'>;

const defaultProps = {
  duration: 2000,
  position: 'center',
  maskClickable: true,
};

export function show(p: ToastShowProps | string) {
  const props = mergeProps(defaultProps, typeof p === 'string' ? { content: p } : p);
  let timer = 0;
  const { duration, afterClose } = props;
  const container = document.createElement('div');
  document.body.appendChild(container);
  hide();
  containers.push(container);

  const TempToast = () => {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
      return () => {
        afterClose?.();
      };
    }, []);

    useEffect(() => {
      if (duration === 0) {
        return;
      }
      timer = window.setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => {
        window.clearTimeout(timer);
      };
    }, []);

    return (
      <InternalToast
        {...props}
        container={container}
        visible={visible}
        afterClose={() => {
          unmount(container);
        }}
      />
    );
  };
  ReactDOM.render(<TempToast />, container);
}

export function hide() {
  const container = containers.pop();
  if (!container) return;
  unmount(container);
}

export function mergeProps<A, B>(a: A, b: B): B & A;
export function mergeProps<A, B, C>(a: A, b: B, c: C): C & B & A;
export function mergeProps(...items: any[]) {
  function customizer(objValue: any, srcValue: any) {
    return isUndefined(srcValue) ? objValue : srcValue;
  }

  let ret = assign({}, items[0]);
  for (let i = 1; i < items.length; i++) {
    ret = assignWith(ret, items[i], customizer);
  }
  return ret;
}
