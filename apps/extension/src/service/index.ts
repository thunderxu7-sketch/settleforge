import { MessageHub } from '../lib/bg_msg';

import { registerSignInService } from './sign_in_service';
import { registerSignOutService } from './sign_out_service';
import {
  registerAutoLockService,
  registerCurrencyService,
  registerLanguageService,
  registerLedgerConnectionService,
  registerToggleBalanceService,
} from './settings_service';
import { registerGetDAppListService } from './get_dapp_list_service';
import { registerDeleteDAppItemService } from './delete_dapp_item_service';
import { registerGetIsAuthedService } from './get_is_authed_service';
import { registerCreatePrivateAccountsService } from './create_private_key_accounts_service';
import { registerCreateMnemonicAccountsService } from './create_mnemonic_accounts_service';
import { registerCreateLedgerAccountsService } from './create_ledger_accounts_service';
import { registerGetLedgerAccountService } from './get_ledger_account_service';
import { registerGetNewAddressInfoService } from './get_new_address_info_service';
import { registerGetMnemonicCountService } from './get_mnemonic_count_service';
import { registerGetMnemonicsAccountService } from './get_mnemonic_accounts_service';
import { registerGetDerivedAddressInfoService } from './get_derived_address_info_service';
import { registerCreateDerivedAddressService } from './create_derived_address_service';
import { registerGetUniqueNameService } from './get_unique_name_service';
import { registerGetAccountRemindStatusService } from './get_account_remind_status_service';
import { registerUpdateAccountRemindStatusService } from './update_account_remind_status_service';
import { registerSetAddressBookItemService } from './set_address_book_item_service';
import { registerDeleteAddressBookItemService } from './delete_address_book_item_service';
import {
  registerAddNodeService,
  registerDeleteNodeService,
  registerSelectedNodeService,
} from './node_management_service';
import { registerUpdateCheckAuthedService } from './update_check_authed_service';
import { registerTabRequestService } from './tab/tab_request_service';
import { registerBackUpService } from './backup_service';
import { registerGetKeyStore } from './get_keystore';
import { registerOpenSecondaryPopupService } from './open_secondary_popup_service';
import { registerGetPendingWebsiteInfoService } from './get_pending_website_info';
import { registerApproveConnectWebsiteService } from './approve_connect_website';
import { registerRejectConnectWebsiteService } from './reject_connect_website';
import { registerDisconnectWebsiteService } from './disconnect_website';
import { registerConnectWebsiteService } from './connect_website';
import { registerAccountsTypeService } from './accounts_type_service';
import { registerSetSelectedAddressService } from './selected_address_service';
import { registerTronWebService } from './tronweb_service';
import { registerUpdateTransferRecordService } from './update_transfer_record_service';
import { registerLedgerConfirmService } from './get_ledger_confirm';
import { registerUpdateNameService } from './update_name_service';
import {
  registerConfirmLedgerSignTransactionService,
  registerConfirmSignTransactionService,
  registerGetConfirmationsService,
  registerRejectAllSignTransactionService,
  registerRejectSignTransactionService,
} from './get_confirmations_service';
import { registerDeleteAddressService } from './delete_address_service';
import { registerSetMultiSignViewedService } from './set_multi_sign_viewed';
import { registerGetWatchAssetService } from './get_watch_asset_service';
import { registerAddWatchAssetService } from './add_watch_asset_service';
import { registerGetSecondaryPopupUrlService } from './get_secondary_popup_url_service';
import { registerResetAppService } from './reset_app_service';
import { registerGetSelectedAccountService } from './get_selected_account_service';
import { registerCloseWatchAssetService } from './close_watch_asset_service';

export function registerAll(messageHub: MessageHub) {
  // FOR TAB request use one service
  registerTabRequestService(messageHub);

  // auth
  registerSignInService(messageHub);
  registerSignOutService(messageHub);

  // setttings
  registerCurrencyService(messageHub);
  registerLanguageService(messageHub);
  registerAutoLockService(messageHub);
  registerLedgerConnectionService(messageHub);
  registerToggleBalanceService(messageHub);

  // dapp list
  registerGetDAppListService(messageHub);
  registerDeleteDAppItemService(messageHub);

  // account
  registerGetIsAuthedService(messageHub);
  registerUpdateCheckAuthedService(messageHub);
  registerCreatePrivateAccountsService(messageHub);
  registerCreateMnemonicAccountsService(messageHub);
  registerCreateLedgerAccountsService(messageHub);
  registerGetLedgerAccountService(messageHub);
  registerGetNewAddressInfoService(messageHub);
  registerGetMnemonicCountService(messageHub);
  registerGetMnemonicsAccountService(messageHub);
  registerGetDerivedAddressInfoService(messageHub);
  registerCreateDerivedAddressService(messageHub);
  registerGetUniqueNameService(messageHub);
  registerGetAccountRemindStatusService(messageHub);
  registerUpdateAccountRemindStatusService(messageHub);

  // address book
  registerSetAddressBookItemService(messageHub);
  registerDeleteAddressBookItemService(messageHub);

  // node management
  registerDeleteNodeService(messageHub);
  registerAddNodeService(messageHub);
  registerSelectedNodeService(messageHub);

  // backup
  registerBackUpService(messageHub);
  registerGetKeyStore(messageHub);
  // secondary popup
  registerOpenSecondaryPopupService(messageHub);

  // connect website
  registerGetPendingWebsiteInfoService(messageHub);
  registerApproveConnectWebsiteService(messageHub);
  registerRejectConnectWebsiteService(messageHub);
  registerConnectWebsiteService(messageHub);
  registerDisconnectWebsiteService(messageHub);

  registerAccountsTypeService(messageHub);
  registerSetSelectedAddressService(messageHub);

  // tronweb
  registerTronWebService(messageHub);

  // transfer record
  registerUpdateTransferRecordService(messageHub);

  //ledger confirm
  registerLedgerConfirmService(messageHub);

  //update name
  registerUpdateNameService(messageHub);

  // sign
  registerGetConfirmationsService(messageHub);
  registerConfirmSignTransactionService(messageHub);
  registerRejectSignTransactionService(messageHub);
  registerConfirmLedgerSignTransactionService(messageHub);
  registerRejectAllSignTransactionService(messageHub);

  //delete address
  registerDeleteAddressService(messageHub);

  registerSetMultiSignViewedService(messageHub);

  registerGetWatchAssetService(messageHub);
  registerAddWatchAssetService(messageHub);

  registerGetSecondaryPopupUrlService(messageHub);

  //reset App
  registerResetAppService(messageHub);

  registerGetSelectedAccountService(messageHub);

  registerCloseWatchAssetService(messageHub);
}
