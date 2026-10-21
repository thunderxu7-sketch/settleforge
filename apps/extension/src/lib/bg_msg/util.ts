import { MessageMetaType } from './types';

export function getOrigin(meta: MessageMetaType): string {
  let origin = meta.sender.origin;

  if (!origin) {
    const url = meta.sender.url;
    if (url) {
      origin = new URL(url).origin;
    }
  }

  return origin!;
}
