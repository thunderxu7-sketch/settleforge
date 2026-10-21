enum PAGES {
  /** Login Page **/
  PAGE_LOGIN = '/login',

  /** Home Page **/
  PAGE_HOMEPAGE = '/home',

  /** Assets Management Page **/
  PAGE_ASSETS_MANAGEMENT = '/assets_management',
  PAGE_ASSETS_MANAGEMENT_MY_ASSETS = '/assets_management/my_assets',
  PAGE_ASSETS_MANAGEMENT_TOKENS = '/assets_management/tokens',
  PAGE_ASSETS_MANAGEMENT_CUSTOM = '/assets_management/custom',

  /** Settings page **/
  PAGE_SETTINGS = '/settings',

  /** node manage page **/
  PAGE_NODE_MANAGEMENT = '/settings/node_management',

  /** address book page **/
  PAGE_ADDRESS_BOOK = '/address_book',

  /** About page **/
  PAGE_ABOUT = '/about',

  /** DApp List **/
  PAGE_DAPPLIST = '/dapp_list',

  /** import Wallet **/
  PAGE_IMPORT_WALLET = '/import_wallet',
  PAGE_IMPORT_CONFIRM = '/import_confirm',
  PAGE_IMPORT_ADDRESS = '/import_address',
  PAGE_IMPORT_PATH = '/import_path',

  /** guide Page **/
  PAGE_GUIDE = '/guide',

  /** create Wallet Page **/
  PAGE_CREATE_WALLET = '/create_wallet',

  /** add Wallet **/
  PAGE_ADD_WALLET = '/add_wallet',

  /** save mnemonic **/
  PAGE_SAVE_MNEMONIC = '/save_mnemonic',

  /** check mnemonic **/
  PAGE_CHECK_MNEMONIC = '/check_mnemonic',

  /** new HD Address Page **/
  PAGE_NEW_HD_ADDRESS = '/new_hd_address',

  /** switch seed Page **/
  PAGE_SWITCH_SEED = '/switch_seed',
  PAGE_MANUAL_PATH = '/manual_path',

  /** transaction receive **/
  PAGE_RECEIVE = '/receive',

  /** import ledger popup **/
  PAGE_LEDGER_CONFIRM = '/ledger_confirm',
  PAGE_LEDGER_ADDRESS = '/ledger_address',
  PAGE_LEDGER_PATH = '/ledger_path',

  /** import ledger guide secondary popup **/
  PAGE_LEDGER_IMPORT_GUIDE = '/ledger/import_guide',

  /** connect website secondary popup **/
  PAGE_CONNECT_WEBSITE = '/connect_website',

  /** transfer  **/
  PAGE_TRANSFER_STEP_1 = '/transfer/step1',
  PAGE_TRANSFER_STEP_2 = '/transfer/step2',
  PAGE_TRANSFER_STEP_3 = '/transfer/step3',

  /** custom sort rules  **/
  PAGE_CUSTOM_SORT = '/custom_sort',

  /** transfer broadcast  **/
  PAGE_BROADCAST = '/broadcast',

  /** sign confirmation **/
  PAGE_SIGN = '/sign',

  /** transfer detail   **/
  PAGE_TRANSFER_DETAIL = '/transfer_detail',

  /** asset detail   **/
  PAGE_ASSET_DETAIL = '/asset_detail',

  /** export account **/
  PAGE_EXPORT_ACCOUNT = '/export_account',
  /** watch asset **/
  PAGE_WATCH_ASSET = '/watch_asset',
}

export default PAGES;
