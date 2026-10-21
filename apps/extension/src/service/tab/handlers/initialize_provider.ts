import { DuplexMessageMetaType } from '../../../lib/bg_msg/types';
import { getOrigin } from '../../../lib/bg_msg/util';
import { requestAccountsManager } from '../../../domain/request_accounts_manager';

export const initializeProvider = async (uuid: string, meta: DuplexMessageMetaType) => {
  const origin = getOrigin(meta);

  const response = await requestAccountsManager.makeConnectData(origin);

  meta.resolve({
    success: true,
    data: response,
    uuid,
  });
};
