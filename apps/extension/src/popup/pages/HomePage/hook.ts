import { Dispatch, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { NavigateFunction, useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import log from 'loglevel';

import PAGES from './../../../constants/pages';
import { useTronWebInstance } from '../../../hooks/tronweb_popup';
import { msgNode } from '../../inst';
import { getNodeIds, getNodeList, getSelectedNode } from '../../../store/slices/node_management';
import { callSelectedNodeService } from '../../../service/node_management_service';
import { callAccountsTypeService } from '../../../service/accounts_type_service';
import { callSetSelectedAddressService } from '../../../service/selected_address_service';
import { useAppSelector } from '../../../store/hooks';
import { AddressItemsRecord, selectAddressInfo } from '../../../store/slices/address_info';
import { resourceManager } from '../../../domain/resource_manager';
import { CurrencyType, selectBalanceVisible, selectCurrency } from '../../../store/slices/settings';
import { PricesType, usePricesInfo } from '../../../hooks/prices_info';
import {
  hideZeroToken,
  hideZeroTokenTRC721,
  sortToken,
  sortTokenManual,
} from '../../utils/assetUtils';
import { changeKeyRed, delay } from '../../utils';
import { BigNumber, BigNumberValue } from '../../utils/numberUtils';
import Toast from '../../../components/Toast';
import { ACCOUNT_TYPE, DEFAULT_INTERVAL_TIME } from './constants';
import { selectMultiSignInfo } from '../../../store/slices/multi_sign';
import { callSetMultiSignViewedService } from '../../../service/set_multi_sign_viewed';
import { callGetAccountRemindStatusService } from '../../../service/get_account_remind_status_service';
import { setAccountInfo } from '../../../hooks/account_info';
import { supportStorageKey, WALLET_EXPORT_TYPE } from '../../../constants/wallet_type';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';
import { callToggleBalanceVisibleService } from '../../../service/settings_service';
import { setShowWalletList, showWalletList } from '../../common/walletList';
import { useRemindModal } from '../../../components/RemindModal';

export interface AddressItemCompType {
  name: string;
  address: string;
  activeTime: number;
  createdTime: number;
  accountType: 0 | 1 | 2;
  totalTrx: BigNumberValue;
  totalAsset: BigNumberValue;
  current: boolean;
}

type AssetType = Array<any>;

export interface FilterOptionsType {
  sortType: number;
  hideSmallWorthAsset: boolean;
}

export interface WalletInfoType {
  selectedAccounts: Array<AddressItemCompType>;
  recentAccounts: Array<AddressItemCompType>;
  hotAccounts: Array<AddressItemCompType>;
  ledgerAccounts: Array<AddressItemCompType>;
  accountsType: { [key: string]: string };
  totalTrx: BigNumberValue;
  totalAsset: BigNumberValue;
}

interface State {
  filterVisible: boolean;
  walletListVisible: boolean;
  walletSearchVisible: boolean;
  walletSearchResult: any;
  walletSearchValue: string;
  homeAsset: AssetType;
  homeCollection: AssetType;
  currentTrxBalance: string;
  currentAssetValue: string;

  tabIndex: 0 | 1;
  clearVisible: boolean;
  tokenSearchValue: string;
  fieldFound: boolean;
  tokenDomList: AssetType;
  tokenDataList: AssetType;

  filterOptions: FilterOptionsType;
  isAuthWebsitesVisible: boolean;
  isWebsiteConnected: boolean;
  walletInfo: WalletInfoType;
  addressResource: any;
  isConnectedWebsitesVisible: boolean;
  isConnectedAddressesVisible: boolean;
  menuListVisible: boolean;
  selectVisible: boolean;

  isMultiSignNoticeVisible: boolean;
  isMultiSignJumpVisible: boolean;

  filterImage: string;

  nameModalVisible: boolean;
  deleteAddressVisible: boolean;
  remindStatus: boolean;

  balanceVisible: boolean;
  isSearchBarVisible: boolean;
}

const initialState: State = {
  filterVisible: false,
  walletListVisible: false,
  walletSearchResult: [],
  walletSearchValue: '',
  walletSearchVisible: false,

  homeAsset: [],
  homeCollection: [],
  currentTrxBalance: '',
  currentAssetValue: '',

  tabIndex: 0,
  clearVisible: false,
  tokenSearchValue: '',
  fieldFound: false,
  tokenDomList: [],
  tokenDataList: [],

  filterOptions: {
    sortType: 1,
    hideSmallWorthAsset: false,
  },
  isAuthWebsitesVisible: false,
  isWebsiteConnected: false,
  walletInfo: {
    selectedAccounts: [],
    recentAccounts: [],
    hotAccounts: [],
    ledgerAccounts: [],
    accountsType: {},
    totalTrx: '--',
    totalAsset: '--',
  },
  addressResource: {},
  isConnectedWebsitesVisible: false,
  isConnectedAddressesVisible: false,
  menuListVisible: false,
  selectVisible: false,

  isMultiSignNoticeVisible: false,
  isMultiSignJumpVisible: false,

  filterImage: '',

  nameModalVisible: false,
  deleteAddressVisible: false,
  remindStatus: false,

  balanceVisible: true,
  isSearchBarVisible: false,
};

type Action =
  | { type: 'SET_FILTER_VISIBLE'; payload: boolean }
  | { type: 'SET_WALLET_LIST_VISIBLE'; payload: boolean }
  | { type: 'SET_MENU_LIST_VISIBLE'; payload: boolean }
  | { type: 'SET_NODE_LIST_VISIBLE'; payload: boolean }
  | { type: 'SET_WALLET_SEARCH_RESULT'; payload: any }
  | { type: 'SET_WALLET_SEARCH_VALUE'; payload: string }
  | { type: 'SET_WALLET_SEARCH_VISIBLE'; payload: boolean }
  | { type: 'UPDATE_HOME_ASSET'; payload: AssetType }
  | { type: 'UPDATE_HOME_COLLECTION'; payload: AssetType }
  | { type: 'CHANGE_TAB'; payload: any }
  | { type: 'SET_CLEAR_VISIBLE'; payload: boolean }
  | { type: 'SET_TOKEN_SEARCH_VALUE'; payload: string }
  | { type: 'SET_FIELD_FOUND'; payload: boolean }
  | { type: 'SET_TOKEN_DOM_LIST'; payload: AssetType }
  | { type: 'SET_TOKEN_DATA_LIST'; payload: AssetType }
  | { type: 'SET_FILTER_OPTIONS'; payload: FilterOptionsType }
  | { type: 'UPDATE_WALLET_INFO'; payload: WalletInfoType }
  | { type: 'UPDATE_ADDRESS_RESOURCE'; payload: any }
  | { type: 'TOGGLE_CONNECTED_WEBSITES' }
  | { type: 'TOGGLE_CONNECTED_ADDRESSES' }
  | { type: 'SET_MULTISIGN_NOTICE_VISIBLE'; payload: boolean }
  | { type: 'SET_MULTISIGN_JUMP_VISIBLE'; payload: boolean }
  | { type: 'SET_FILTER_IMAGE'; payload: string }
  | {
      type: 'UPDATE_HOME_DATA';
      payload: {
        homeAsset: AssetType;
        homeCollection: AssetType;
        addressResource: any;
        filterOptions: FilterOptionsType;
      };
    }
  | {
      type: 'CLEAR_INPUT_VALUE';
      payload: {
        hideSearchBar: boolean;
      };
    }
  | {
      type: 'TOGGLE_UPDATE_NAME_MODAL';
    }
  | {
      type: 'TOGGLE_DELETE_ADDRESS_MODAL';
    }
  | {
      type: 'SET_REMIND_STATUS';
      payload: boolean;
    }
  | {
      type: 'UPDATE_WALLET_NAME';
      payload: {
        address: string;
        name: string;
      };
    }
  | {
      type: 'SET_BALANCE_VISIBLE';
      payload: boolean;
    }
  | {
      type: 'TOGGLE_SEARCH_BAR';
    };

type LocalDispatch = Dispatch<Action>;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_FILTER_VISIBLE':
      return {
        ...state,
        filterVisible: action.payload,
      };
    case 'CHANGE_TAB':
      return {
        ...state,
        tabIndex: action.payload,
      };
    case 'SET_CLEAR_VISIBLE':
      return {
        ...state,
        clearVisible: action.payload,
      };
    case 'SET_TOKEN_SEARCH_VALUE':
      return {
        ...state,
        tokenSearchValue: action.payload,
      };
    case 'SET_FIELD_FOUND':
      return {
        ...state,
        fieldFound: action.payload,
      };
    case 'SET_TOKEN_DOM_LIST':
      return {
        ...state,
        tokenDomList: action.payload,
      };
    case 'SET_TOKEN_DATA_LIST':
      return {
        ...state,
        tokenDataList: action.payload,
      };
    case 'SET_WALLET_LIST_VISIBLE':
      return {
        ...state,
        walletListVisible: action.payload,
        walletSearchValue: '',
        walletSearchResult: [],
        walletSearchVisible: false,
      };
    case 'SET_MENU_LIST_VISIBLE':
      return {
        ...state,
        menuListVisible: action.payload,
      };
    case 'SET_NODE_LIST_VISIBLE':
      return {
        ...state,
        selectVisible: action.payload,
      };
    case 'SET_WALLET_SEARCH_RESULT':
      return {
        ...state,
        walletSearchResult: action.payload,
      };
    case 'SET_WALLET_SEARCH_VALUE':
      return {
        ...state,
        walletSearchValue: action.payload,
      };
    case 'SET_WALLET_SEARCH_VISIBLE':
      return {
        ...state,
        walletSearchVisible: action.payload,
      };
    case 'UPDATE_HOME_ASSET':
      return {
        ...state,
        homeAsset: action.payload,
      };
    case 'UPDATE_HOME_COLLECTION':
      return {
        ...state,
        homeCollection: action.payload,
      };
    case 'SET_FILTER_OPTIONS':
      return {
        ...state,
        filterOptions: action.payload,
      };
    case 'TOGGLE_CONNECTED_WEBSITES':
      return {
        ...state,
        isConnectedWebsitesVisible: !state.isConnectedWebsitesVisible,
      };
    case 'TOGGLE_CONNECTED_ADDRESSES':
      return {
        ...state,
        isConnectedAddressesVisible: !state.isConnectedAddressesVisible,
      };
    case 'UPDATE_WALLET_INFO':
      return {
        ...state,
        walletInfo: {
          ...action.payload,
        },
      };
    case 'UPDATE_ADDRESS_RESOURCE':
      return {
        ...state,
        addressResource: action.payload,
      };
    case 'SET_MULTISIGN_NOTICE_VISIBLE':
      return {
        ...state,
        isMultiSignNoticeVisible: action.payload,
      };
    case 'SET_MULTISIGN_JUMP_VISIBLE':
      return {
        ...state,
        isMultiSignJumpVisible: action.payload,
      };
    case 'SET_FILTER_IMAGE':
      return {
        ...state,
        filterImage: action.payload,
      };
    case 'UPDATE_HOME_DATA':
      return {
        ...state,
        ...action.payload,
      };
    case 'CLEAR_INPUT_VALUE':
      return {
        ...state,
        tokenDomList: [],
        fieldFound: false,
        clearVisible: false,
        tokenSearchValue: '',
        isSearchBarVisible: action.payload.hideSearchBar ? false : state.isSearchBarVisible,
      };
    case 'TOGGLE_UPDATE_NAME_MODAL':
      return {
        ...state,
        nameModalVisible: !state.nameModalVisible,
      };
    case 'TOGGLE_DELETE_ADDRESS_MODAL':
      return {
        ...state,
        deleteAddressVisible: !state.deleteAddressVisible,
      };
    case 'SET_REMIND_STATUS':
      return {
        ...state,
        remindStatus: action.payload,
      };
    case 'UPDATE_WALLET_NAME': {
      const newWalletInfo = _.clone(state.walletInfo);
      _.concat(
        newWalletInfo.selectedAccounts,
        newWalletInfo.recentAccounts,
        newWalletInfo.hotAccounts,
        newWalletInfo.ledgerAccounts,
      ).forEach((ele) => {
        if (ele.address == action.payload.address) {
          ele.name = action.payload.name;
        }
      });
      return {
        ...state,
        walletInfo: newWalletInfo,
      };
    }
    case 'SET_BALANCE_VISIBLE':
      return {
        ...state,
        balanceVisible: action.payload,
      };
    case 'TOGGLE_SEARCH_BAR':
      return {
        ...state,
        isSearchBarVisible: !state.isSearchBarVisible,
      };
    default:
      return state;
  }
};

let intervalInstance: null | NodeJS.Timeout = null;

let unMounted = true;

export const useHomePageBiz = () => {
  const { formatMessage } = useIntl();
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  const nodeIds = useAppSelector(getNodeIds);
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo.selectedAddress;
  const addressItems = addressInfo.addressItems;
  const selectedAddressItem = addressItems[selectedAddress];
  const nodeList = useAppSelector(getNodeList);
  const selectedNode = useAppSelector(getSelectedNode);
  const selectedCurrency = useAppSelector(selectCurrency);
  const balanceVisible = useAppSelector(selectBalanceVisible);

  const { pricesInfo } = usePricesInfo();
  const { tronWebInstance } = useTronWebInstance();

  useEffect(() => {
    setWalletListVisible(showWalletList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const multiSignInfo = useAppSelector(selectMultiSignInfo);

  const multiSignCount = useMemo((): number => {
    if (multiSignInfo[selectedAddress]) {
      return (Object.values(multiSignInfo[selectedAddress]) as Array<{ status: boolean }>).filter(
        (ele) => ele.status,
      ).length;
    }
    return 0;
  }, [multiSignInfo, selectedAddress]);

  useEffect(() => {
    if (multiSignCount) {
      dispatch({ type: 'SET_MULTISIGN_NOTICE_VISIBLE', payload: true });
    }
  }, [multiSignCount]);

  const flag = useRef<boolean>(false);

  useEffect(() => {
    unMounted = false;
    const func = async () => {
      Toast.show({
        icon: 'loading',
        duration: 3000,
      });
      await resourceManager.getResourceInfoFromStorage();
      await updateHomePageData({
        needRefreshResources: false,
        selectedAddress,
        addressItems,
        selectedNode,
        tronWebInstance,
        pricesInfo,
        selectedCurrency,
        navigate,
        dispatch,
      });

      await updateHomePageData({
        needRefreshResources: true,
        selectedAddress,
        addressItems,
        selectedNode,
        tronWebInstance,
        pricesInfo,
        selectedCurrency,
        navigate,
        dispatch,
      });
      Toast.hide();
      flag.current = true;
    };
    func();
    if (!intervalInstance) {
      intervalInstance = setInterval(async () => {
        await resourceManager.fetchIntervalResourceInfo(tronWebInstance);
      }, DEFAULT_INTERVAL_TIME);
    }
    return () => {
      // @ts-ignore
      clearInterval(intervalInstance);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilterVisible = useCallback((filterVisible: boolean) => {
    dispatch({
      type: 'SET_FILTER_VISIBLE',
      payload: filterVisible,
    });
  }, []);

  const setFilterOptions = useCallback(
    async (key: string, value: any) => {
      unMounted = true;
      if (key == 'hideSmallWorthAsset') {
        await resourceManager.setHideSmallWorthAsset(selectedAddress, selectedNode, value);
      } else if (key == 'sortType') {
        await resourceManager.setSortType(selectedAddress, selectedNode, value);
      }
      dispatch({
        type: 'SET_FILTER_OPTIONS',
        payload: {
          ...state.filterOptions,
          [key]: value,
        },
      });
      Toast.show({
        icon: 'loading',
        duration: 0,
      });

      await updateHomePageData({
        selectedAddress,
        addressItems,
        selectedNode,
        tronWebInstance,
        pricesInfo,
        selectedCurrency,
        navigate,
        dispatch,
      });

      await delay(500);
      Toast.hide();
      setFilterVisible(false);
    },
    [
      state.filterOptions,
      selectedAddress,
      selectedNode,
      setFilterVisible,
      addressItems,
      navigate,
      pricesInfo,
      selectedCurrency,
      tronWebInstance,
    ],
  );

  const setWalletListVisible = useCallback((walletListVisible: boolean) => {
    !walletListVisible && setShowWalletList(walletListVisible);
    dispatch({
      type: 'SET_WALLET_LIST_VISIBLE',
      payload: walletListVisible,
    });
  }, []);

  const setWalletSearchVisible = useCallback((walletSearchVisible: boolean) => {
    dispatch({
      type: 'SET_WALLET_SEARCH_VISIBLE',
      payload: walletSearchVisible,
    });
  }, []);

  const onClickNode = useCallback(async (nodeId: string) => {
    await callSelectedNodeService(msgNode, { value: nodeId });
    unMounted = true;
  }, []);

  useEffect(() => {
    if (!flag.current) {
      return;
    }
    (async () => {
      const tTimer = setTimeout(() => {
        Toast.hide();
        Toast.show({
          icon: '',
          content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
        });
      }, 30000);

      unMounted &&
        Toast.show({
          icon: 'loading',
          content: '',
          duration: 0,
        });
      await updateHomePageData({
        needRefreshResources: true,
        selectedAddress,
        addressItems,
        selectedNode,
        tronWebInstance,
        pricesInfo,
        selectedCurrency,
        navigate,
        dispatch,
      });
      clearTimeout(tTimer);
      setTimeout(() => {
        Toast.hide();
      }, Math.round(Math.random() * 400) + 1300);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode, selectedAddress]);

  useEffect(() => {
    dispatch({
      type: 'UPDATE_WALLET_NAME',
      payload: {
        address: selectedAddress,
        name: selectedAddressItem?.name,
      },
    });
  }, [selectedAddressItem?.name]);

  const clearInputValue = useCallback((hideSearchBar: boolean = false) => {
    dispatch({
      type: 'CLEAR_INPUT_VALUE',
      payload: {
        hideSearchBar,
      },
    });
  }, []);

  // asset list page
  const tokenSearchOnChange = useCallback(
    (value: string) => {
      if (value?.length > 0) {
        dispatch({
          type: 'SET_CLEAR_VISIBLE',
          payload: true,
        });
        dispatch({
          type: 'SET_TOKEN_SEARCH_VALUE',
          payload: value,
        });
      } else {
        clearInputValue();
      }
    },
    [clearInputValue],
  );

  useEffect(() => {
    const value = state.tokenSearchValue?.trim();
    const dataDomList: any = [];
    let validQuantity = 0;
    if (state.tokenSearchValue?.trim()) {
      const asset = state.tabIndex === 0 ? [...state.homeAsset] : [...state.homeCollection];
      asset.map(
        (item: {
          name: string;
          shortName: string;
          type: number;
          id: string;
          contractAddress: string;
        }) => {
          const { shortName, type, name } = item;
          let name1 = shortName;

          if (type === 0) {
            // trx
            name1 = 'TRX';
          }
          const itemData: any = changeKeyRed([name1, type === 5 ? name : ''], value);

          const searchFullNameSingle: any = changeKeyRed([name], value);
          let searchIdSingle = false;
          let searchContractAddressSingle = false;
          if (type === 1) {
            searchIdSingle = item.id === value;
          } else if (type === 2 || type === 5) {
            searchContractAddressSingle = item.contractAddress === value;
          }

          if (itemData?.found && itemData.found?.input !== 'undefined') {
            validQuantity++;
            dataDomList.push(itemData);
          } else if (
            (searchFullNameSingle?.found && searchFullNameSingle.found?.input !== 'undefined') ||
            searchIdSingle ||
            searchContractAddressSingle
          ) {
            validQuantity++;
            dataDomList.push({
              found: true,
              dom: '',
            });
          } else {
            dataDomList.push({
              found: false,
              dom: '',
            });
          }
        },
      );

      dispatch({
        type: 'SET_FIELD_FOUND',
        payload: validQuantity > 0,
      });

      dispatch({
        type: 'SET_TOKEN_DOM_LIST',
        payload: dataDomList,
      });
    }
  }, [state.tokenSearchValue, state.tabIndex, state.homeAsset, state.homeCollection]);

  const changeTab = useCallback((tabIndex: 0 | 1) => {
    dispatch({ type: 'CHANGE_TAB', payload: tabIndex });
  }, []);

  const toggleConnectedWebsites = useCallback(() => {
    dispatch({ type: 'TOGGLE_CONNECTED_WEBSITES' });
  }, []);

  const toggleConnectedAddresses = useCallback(() => {
    dispatch({ type: 'TOGGLE_CONNECTED_ADDRESSES' });
  }, []);

  const toggleNameModalVisible = useCallback(() => {
    dispatch({ type: 'TOGGLE_UPDATE_NAME_MODAL' });
  }, []);

  const toggleDeleteAddressVisible = useCallback(() => {
    dispatch({ type: 'TOGGLE_DELETE_ADDRESS_MODAL' });
  }, []);

  useEffect(() => {
    (async () => {
      const { remind } = await callGetAccountRemindStatusService(msgNode, {
        address: selectedAddress,
      });
      dispatch({
        type: 'SET_REMIND_STATUS',
        payload: remind,
      });
    })();
  }, [selectedAddress]);

  const onClickWalletCard = async (address: string) => {
    setWalletListVisible(false);
    if (address !== selectedAddress) {
      await callSetSelectedAddressService(msgNode, { address });
      unMounted = true;
      clearInputValue(true);

      updateFilterImage('');
    }
  };

  const onChangeWalletSearch = (value: string) => {
    dispatch({
      type: 'SET_WALLET_SEARCH_VALUE',
      payload: value,
    });
    let walletSearchResult: AddressItemCompType[];
    // more than 1 start to search and show results
    if (value == '') {
      walletSearchResult = [];
    } else {
      const { walletInfo } = state;
      const { hotAccounts, ledgerAccounts } = walletInfo;
      const allAccounts = hotAccounts.concat(ledgerAccounts);
      if (value.length < 2) {
        walletSearchResult = allAccounts.filter(
          (item) => item.name.toLocaleUpperCase().indexOf(value.toLocaleUpperCase()) > -1,
        );
      } else {
        walletSearchResult = allAccounts.filter(
          (item) =>
            item.name.toLocaleUpperCase().indexOf(value.toLocaleUpperCase()) > -1 ||
            item.address.toLocaleUpperCase().indexOf(value.toLocaleUpperCase()) > -1,
        );
      }
    }

    dispatch({
      type: 'SET_WALLET_SEARCH_RESULT',
      payload: walletSearchResult,
    });
  };

  const setMenuListVisible = useCallback((menuListVisible: boolean) => {
    dispatch({
      type: 'SET_MENU_LIST_VISIBLE',
      payload: menuListVisible,
    });
  }, []);

  const setSelectVisible = useCallback((selectVisible: boolean) => {
    dispatch({
      type: 'SET_NODE_LIST_VISIBLE',
      payload: selectVisible,
    });
  }, []);

  const toggleBalanceVisible = useCallback(async () => {
    await callToggleBalanceVisibleService(msgNode);
  }, []);

  const closeMultiSignNotice = useCallback(async (openJump: boolean) => {
    await callSetMultiSignViewedService(msgNode);
    dispatch({ type: 'SET_MULTISIGN_NOTICE_VISIBLE', payload: false });
    if (openJump) {
      dispatch({ type: 'SET_MULTISIGN_JUMP_VISIBLE', payload: true });
    }
  }, []);

  const closeMultiSignJump = useCallback(() => {
    dispatch({ type: 'SET_MULTISIGN_JUMP_VISIBLE', payload: false });
  }, []);

  const updateFilterImage = useCallback((filterImage: string) => {
    dispatch({ type: 'SET_FILTER_IMAGE', payload: filterImage });
  }, []);

  const backupMnemonic = useCallback(async () => {
    await setAccountInfo(supportStorageKey.exportType, WALLET_EXPORT_TYPE.MNEMONIC);
    navigate(PAGES.PAGE_SAVE_MNEMONIC);
  }, [navigate]);

  const updateDeleteAddress = useCallback(async (address: string) => {
    await resourceManager.deleteAddressResourceInfo(address);
  }, []);

  const toggleSearchBar = useCallback(() => {
    dispatch({
      type: 'TOGGLE_SEARCH_BAR',
    });
  }, []);

  const checkSelectStatus = useCallback(
    (e: any) => {
      const { className } = e.target;
      if (state.menuListVisible && className?.indexOf('menu') < 0) {
        setMenuListVisible(false);
      }
      if (state.selectVisible && className?.indexOf('selectShow') < 0) {
        setSelectVisible(false);
      }

      if (state.tokenSearchValue == '' && state.isSearchBarVisible) {
        toggleSearchBar();
      }
    },
    [
      state.menuListVisible,
      state.selectVisible,
      setMenuListVisible,
      setSelectVisible,
      state.tokenSearchValue,
      state.isSearchBarVisible,
      toggleSearchBar,
    ],
  );

  const refreshHomePage = useCallback(async () => {
    Toast.show({
      icon: 'loading',
      content: '',
      duration: 0,
    });

    await updateHomePageData({
      needRefreshResources: true,
      selectedAddress,
      addressItems,
      selectedNode,
      tronWebInstance,
      pricesInfo,
      selectedCurrency,
      navigate,
      dispatch,
    });

    await delay(2000);
    Toast.hide();
  }, [
    selectedAddress,
    addressItems,
    selectedNode,
    tronWebInstance,
    pricesInfo,
    selectedCurrency,
    navigate,
  ]);

  return {
    state,
    selectedCurrency,
    setFilterVisible,
    setWalletListVisible,
    setWalletSearchVisible,

    selectedAddressItem,
    nodeIds,
    nodeList,
    selectedNode,
    onClickNode: useCheckLoginBeforeAction(onClickNode),
    addressInfo,

    changeTab,
    tokenSearchOnChange,
    clearInputValue,

    setFilterOptions,
    toggleConnectedWebsites: useCheckLoginBeforeAction(toggleConnectedWebsites),
    toggleConnectedAddresses: useCheckLoginBeforeAction(toggleConnectedAddresses),
    onClickWalletCard: useCheckLoginBeforeAction(onClickWalletCard),
    onChangeWalletSearch,
    toggleNameModalVisible: useCheckLoginBeforeAction(toggleNameModalVisible),
    toggleDeleteAddressVisible: useCheckLoginBeforeAction(toggleDeleteAddressVisible),
    updateDeleteAddress: useCheckLoginBeforeAction(updateDeleteAddress),
    backupMnemonic: useCheckLoginBeforeAction(backupMnemonic),
    setMenuListVisible,
    setSelectVisible,

    multiSignCount,
    closeMultiSignNotice,
    closeMultiSignJump,
    updateFilterImage,
    checkSelectStatus,

    balanceVisible,
    toggleBalanceVisible,

    refreshHomePage,
    toggleSearchBar,
  };
};

const setHomePageData = async (
  selectedNode: string,
  selectedAddress: string,
  pricesInfo: PricesType,
  dispatch: LocalDispatch,
) => {
  try {
    const addressData = _.get(resourceManager.resourceInfo, [selectedAddress], {});
    const nodeData = _.get(addressData, ['nodes', selectedNode], {});

    const homeAsset =
      (await resourceManager.getFollowedAssetList(selectedAddress, selectedNode)) || [];
    const homeCollection =
      (await resourceManager.getFollowedCollectionList(selectedAddress, selectedNode)) || [];
    const energyInfo = _.get(nodeData, 'energyInfo', {});

    const sortType = _.get(nodeData, 'sortType', 1);
    const hideSmallWorthAsset = _.get(nodeData, 'hideSmallWorthAsset', false);

    // processing asset by sort rules and check if hide small asset
    let homeAssetHide = homeAsset?.slice();
    let homeCollectionHide = homeCollection?.slice();
    if (hideSmallWorthAsset) {
      homeAssetHide = hideZeroToken(homeAsset, pricesInfo);
      homeCollectionHide = hideZeroTokenTRC721(homeCollection);
    }
    let homeAssetSort = [];
    let homeCollectionSort = [];
    if (sortType === 1) {
      const sortManualAsset = _.get(nodeData, 'sortManualAsset', []);
      const sortManualCollection = _.get(nodeData, 'sortManualCollection', []);
      homeAssetSort = sortTokenManual(homeAssetHide, sortManualAsset);
      homeCollectionSort = sortTokenManual(homeCollectionHide, sortManualCollection);
    } else {
      homeAssetSort = sortToken(homeAssetHide, sortType);
      homeCollectionSort = sortToken(homeCollectionHide, sortType, true);
    }
    dispatch({
      type: 'UPDATE_HOME_DATA',
      payload: {
        homeAsset: homeAssetSort,
        addressResource: energyInfo,
        homeCollection: homeCollectionSort,
        filterOptions: {
          sortType,
          hideSmallWorthAsset,
        },
      },
    });
  } catch (error) {
    log.info('setHomePageData: ', error);
  }
};

const setWalletInfo = async (
  selectedAddress: string,
  addressItems: AddressItemsRecord,
  pricesInfo: PricesType,
  selectedCurrency: CurrencyType,
  selectedNode: string,
  navigate: NavigateFunction,
  dispatch: LocalDispatch,
) => {
  try {
    let accountsType;
    try {
      accountsType = await callAccountsTypeService(msgNode);
    } catch (e) {
      log.error('callAccountsTypeService', e);
      navigate(PAGES.PAGE_LOGIN);
      return;
    }
    let totalTrx = new BigNumber(0);
    let totalAsset = new BigNumber(0);
    let selectedAccounts: Array<AddressItemCompType> = [];
    const addressItemsArr = Object.values(addressItems);
    const addressItemsArrSort = _.orderBy(addressItemsArr, ['createdTime'], ['asc']);
    const commonAccounts: Array<AddressItemCompType> = [];
    const len = addressItemsArrSort?.length;
    for (let i = 0; i < len; i++) {
      const item = addressItemsArrSort[i];
      const newItem: AddressItemCompType = {
        ...item,
        accountType: 1,
        totalTrx: '--',
        totalAsset: '--',
        current: false,
      };

      const address = item.address;
      newItem.accountType = accountsType[address];

      const {
        balance: currentAddressTotalTrx,
        usdBalance: currentAddressTotalUSD,
        cnyBalance: currentAddressTotalCNY,
      } = (await resourceManager.getCurrentAddressTotalTrx(
        address,
        selectedNode,
        // @ts-ignore
        addressItems,
      )) || 0;

      const currentAddressTotalAsset =
        selectedCurrency === 'CNY' ? currentAddressTotalCNY : currentAddressTotalUSD;
      newItem.totalTrx = currentAddressTotalTrx;

      newItem.totalAsset = currentAddressTotalAsset;
      if (address === selectedAddress) {
        newItem.current = true;
        selectedAccounts = [{ ...newItem }];
      }
      totalTrx = totalTrx.plus(currentAddressTotalTrx);
      totalAsset = totalAsset.plus(new BigNumber(currentAddressTotalAsset).toFixed(3, 1)); //keep total value is same with card sum value
      commonAccounts.push({ ...newItem });
    }

    let recentAccounts: Array<AddressItemCompType> = [];
    if (_.size(commonAccounts) >= 6) {
      recentAccounts = _.filter(commonAccounts, (item) => item.activeTime > 0);
      if (_.size(recentAccounts) === 0) {
        recentAccounts = _.filter(commonAccounts, (item) => item.address === selectedAddress);
      }
      recentAccounts = _.orderBy(recentAccounts, ['activeTime', 'createdTime'], ['desc', 'asc']);
      recentAccounts = recentAccounts.slice(0, 3);
    }

    const hotAccounts: Array<AddressItemCompType> = [];
    const ledgerAccounts: Array<AddressItemCompType> = [];
    commonAccounts.forEach((item) => {
      if (item.accountType === ACCOUNT_TYPE.LEDGER) {
        ledgerAccounts.push(item);
      } else {
        hotAccounts.push(item);
      }
    });

    dispatch({
      type: 'UPDATE_WALLET_INFO',
      payload: {
        selectedAccounts,
        recentAccounts,
        hotAccounts,
        ledgerAccounts,
        accountsType,
        totalTrx,
        totalAsset,
      },
    });
  } catch (e) {
    log.info('setWalletInfo error: ', e);
  }
};

interface UpdateHomePageDataParam {
  needRefreshResources?: boolean;
  selectedAddress: string;
  addressItems: AddressItemsRecord;
  selectedNode: string;
  tronWebInstance: any;
  pricesInfo: PricesType;
  selectedCurrency: CurrencyType;
  navigate: NavigateFunction;
  dispatch: LocalDispatch;
}

const updateHomePageData = async ({
  needRefreshResources,
  selectedAddress,
  addressItems,
  selectedNode,
  tronWebInstance,
  pricesInfo,
  selectedCurrency,
  navigate,
  dispatch,
}: UpdateHomePageDataParam) => {
  if (needRefreshResources !== undefined) {
    if (needRefreshResources) {
      await resourceManager.setFollowedAssetList(selectedAddress, selectedNode);
      await resourceManager.setFollowedCollectionList(selectedAddress, selectedNode);
      await resourceManager.setEnergyInfo(tronWebInstance, selectedNode, selectedAddress);
      // @ts-ignore
      await resourceManager.setAccountsTotalTrx(selectedAddress, addressItems, selectedNode);
    } else {
      await resourceManager.getResourceInfoFromStorage();
    }
  }

  await setHomePageData(selectedNode, selectedAddress, pricesInfo, dispatch);
  await setWalletInfo(
    selectedAddress,
    addressItems,
    pricesInfo,
    selectedCurrency,
    selectedNode,
    navigate,
    dispatch,
  );
};
