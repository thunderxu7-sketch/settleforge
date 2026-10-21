import { DuplexMessageMetaType } from '../../../lib/bg_msg/types';
import { phishingListManager } from '../../../domain/phishing_list_manager';

export const visitedRecord = (uuid: string, data: any, meta: DuplexMessageMetaType) => {
  const { href = '' } = data;
  phishingListManager.setVisited(href);
  meta.resolve({
    success: true,
    data: '',
    uuid,
  });
};
