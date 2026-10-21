import log from 'loglevel';

import { DuplexMessageMetaType } from '../../../../lib/bg_msg/types';
import { accountManager } from '../../../../domain/account_manager';
import { requestAccountsManager } from '../../../../domain/request_accounts_manager';
import { watchAssetManager } from '../../../../domain/watch_asset_manager';

export const commonRequest = async (uuid: string, data: any, meta: DuplexMessageMetaType) => {
  const { method, params } = data;
  log.debug('**** commonRequest', data, params);

  if (accountManager.isLocked()) {
    if (method == 'tron_requestAccounts') {
      meta.resolve({
        success: true,
        data: '',
        uuid,
      });
      return;
    } else {
      meta.resolve({
        success: false,
        data: '[commonRequest]: The wallet is locked.',
        uuid,
      });
      return;
    }
  }

  switch (method) {
    case 'tron_requestAccounts': {
      await requestAccountsManager.requestAccounts(uuid, params, meta);
      break;
    }
    case 'wallet_watchAsset': {
      const address = params.options?.address;
      if (!address) {
        return meta.resolve({
          success: false,
          data: 'Invalid address provided',
          uuid,
        });
      }
      watchAssetManager.showAddTokenPopup(address).then();
      meta.resolve({
        success: true,
        data: '',
        uuid,
      });
      break;
    }
    default:
      meta.resolve({
        success: false,
        data: '[commonRequest]: Unknown method called',
        uuid,
      });
      break;
  }
};
