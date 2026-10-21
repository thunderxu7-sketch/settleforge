import { useCallback, useEffect, useReducer } from 'react';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import log from 'loglevel';
import { useLocation, useNavigate } from 'react-router';
// @ts-ignore
import TronWeb from 'tronweb';

import { BigNumber } from '../../../utils/numberUtils';
import { msgNode } from '../../../inst';
import { callSetAddressBookItemService } from '../../../../service/set_address_book_item_service';
import { useSaveLatestLocation } from '../../../../hooks/location';
import { useTronWebInstance } from '../../../../hooks/tronweb_popup';
import { useAppSelector } from '../../../../store/hooks';
import { selectAddressInfo } from '../../../../store/slices/address_info';
import { selectAddressBook } from '../../../../store/slices/address_book';
import {
  selectTransferRecord,
  TransferRecordItemState,
  TransferRecordState,
} from '../../../../store/slices/transfer_record';
import { getSelectedNode } from '../../../../store/slices/node_management';
import PAGES from '../../../../constants/pages';
import { BLACK_HOLE_ADDRESS } from '../../../../constants/address';
import { cutMiddle } from '../../../utils';
import { getTokenById } from '../utils/token';
import { setGaEvent } from '../../../utils/gaUtils';
import { getAccountResourcesByAddress } from '../../../utils/assetUtils';
import Toast from '../../../../components/Toast';
import useCheckLoginBeforeAction from '../../../../hooks/check_logion_before_action';

export interface Address {
  name: string;
  address: string;
  showAddress: string;
  source?: string;
  remarks?: string;
  timestamp?: number;
}

interface AddressCollection {
  [k: string]: Address;
}

export interface State {
  showAddress: string;
  activeTab: string;
  inputStatus: string;
  inputTips: string;
  createAccountCost: string;
  showAddressBook: boolean;
  myAccounts: AddressCollection;
  addressBooks: AddressCollection;
  recentRecord: TransferRecordItemState[];
  searchResult: Set<Address>;
  inputDisable: boolean;
}

const initialState: State = {
  showAddress: '', // address will display on user input
  activeTab: '0',
  inputStatus: '',
  inputTips: '',
  createAccountCost: '0',
  showAddressBook: false,
  myAccounts: {},
  addressBooks: {},
  recentRecord: [],
  searchResult: new Set(),
  inputDisable: false,
};

let showAddressMapAddress: AddressCollection = {};

type Action =
  | { type: 'SET_INPUT_DISABLE'; payload: boolean }
  | { type: 'SET_SEARCH_RESULT'; payload: Set<Address> }
  | {
      type: 'SET_SHOW_ADDRESS_STATUS';
      payload: {
        status: string;
        tips: string;
      };
    }
  | { type: 'SET_CREATE_ACCOUNT_COST'; payload: string }
  | { type: 'SET_MY_ACCOUNT'; payload: AddressCollection }
  | { type: 'SET_ADDRESS_BOOK'; payload: AddressCollection }
  | { type: 'SET_RECENT_RECEIVER'; payload: TransferRecordItemState[] }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_SHOW_ADDRESS_BOOK'; payload: boolean }
  | { type: 'SET_SHOW_ADDRESS'; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_INPUT_DISABLE':
      return {
        ...state,
        inputDisable: action.payload,
      };
    case 'SET_SHOW_ADDRESS':
      return {
        ...state,
        showAddress: action.payload,
      };
    case 'SET_RECENT_RECEIVER':
      return {
        ...state,
        recentRecord: action.payload,
      };
    case 'SET_SEARCH_RESULT':
      return {
        ...state,
        searchResult: action.payload,
      };
    case 'SET_SHOW_ADDRESS_STATUS':
      return {
        ...state,
        inputStatus: action.payload.status,
        inputTips: action.payload.tips,
      };
    case 'SET_CREATE_ACCOUNT_COST':
      return {
        ...state,
        createAccountCost: action.payload,
      };
    case 'SET_MY_ACCOUNT':
      return {
        ...state,
        myAccounts: action.payload,
      };
    case 'SET_ADDRESS_BOOK':
      return {
        ...state,
        addressBooks: action.payload,
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };
    case 'SET_SHOW_ADDRESS_BOOK':
      return {
        ...state,
        showAddressBook: action.payload,
      };

    default:
      return state;
  }
};

export const useTransferStep1Biz = () => {
  const { formatMessage } = useIntl();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { tronWebInstance } = useTronWebInstance();
  const navigate = useNavigate();
  useSaveLatestLocation();

  const addressBook = useAppSelector(selectAddressBook);
  const transferRecord = useAppSelector(selectTransferRecord) as TransferRecordState;
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedNode = useAppSelector(getSelectedNode);
  const addressItems = addressInfo?.addressItems ?? {};
  const selectedAddress = addressInfo?.selectedAddress ?? '';

  const location = useLocation();
  const { selectedTokenId, selectedCollection } = (location.state as any) ?? {
    selectedTokenId: '',
  };

  useEffect(() => {
    return () => {
      showAddressMapAddress = {};
    };
  }, []);

  useEffect(() => {
    getAndConvertData();
    getSearchResult(state.showAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressBook]);

  useEffect(() => {
    const { showAddress } = state;
    let address = showAddress;
    let inputDisable = false;

    if (showAddressMapAddress[showAddress]) {
      address = showAddressMapAddress[showAddress].address;
      inputDisable = true;
    }

    dispatch({
      type: 'SET_INPUT_DISABLE',
      payload: inputDisable,
    });

    getSearchResult(showAddress);

    checkReceiverAddress(address);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.showAddress]);

  // get my account from addressInfo
  const convertMyAccountsData = () => {
    const myAccounts: AddressCollection = {};
    const myAccountsAddress = Object.keys(addressItems);
    myAccountsAddress.map((address) => {
      const name = addressItems[address].name;
      const showAddress = createShowAddress(name, address);
      setShowAddressMapAddress(showAddress, name, address, 'myAccount');

      // add key into accounts, use to render addressItem
      myAccounts[address] = {
        showAddress,
        address,
        name,
      };
    });

    dispatch({
      type: 'SET_MY_ACCOUNT',
      payload: myAccounts,
    });

    return myAccounts;
  };

  const convertAddressBookData = () => {
    const addressBookState: AddressCollection = {};
    Object.keys(addressBook).map((address) => {
      const name = addressBook[address].name;
      const remarks = addressBook[address].remarks;
      const showAddress = createShowAddress(name, address);

      setShowAddressMapAddress(showAddress, name, address, 'addressBook');

      addressBookState[address] = {
        showAddress,
        address,
        name,
        remarks,
      };
    });

    dispatch({
      type: 'SET_ADDRESS_BOOK',
      payload: addressBookState,
    });

    return addressBookState;
  };

  const convertRecentAddressData = (
    myAccounts: AddressCollection,
    addressBooks: AddressCollection,
  ) => {
    try {
      let currentRecords: TransferRecordItemState[] =
        transferRecord[selectedNode][selectedAddress] ?? [];
      currentRecords = currentRecords.slice(0, Math.min(10, currentRecords.length));
      const recentReceivers = currentRecords.map((record) => record.toAddress);

      // get name and showAddress from myAccount and addressBook. addressBook will cover myAccount
      recentReceivers.map((address) => {
        let name = address;
        let showAddress = address;

        if (myAccounts[address]) {
          name = myAccounts[address].name;
          showAddress = createShowAddress(name, address);
        }

        if (addressBooks[address]) {
          name = addressBooks[address].name;
          showAddress = createShowAddress(name, address);
        }
        setShowAddressMapAddress(showAddress, name, address, 'recentReceiver');
      });

      dispatch({
        type: 'SET_RECENT_RECEIVER',
        payload: currentRecords,
      });
    } catch (error) {
      log.info('convertRecentAddressData error: ', error);
    }
  };

  const getAndConvertData = async () => {
    const addressBooks = convertAddressBookData();
    const myAccounts = convertMyAccountsData();
    convertRecentAddressData(myAccounts, addressBooks);
  };

  const setShowAddress = useCallback((value: string) => {
    dispatch({
      type: 'SET_SHOW_ADDRESS',
      payload: value.trim(),
    });
  }, []);

  const showAddressBookDetail = useCallback((isShow: boolean) => {
    dispatch({
      type: 'SET_SHOW_ADDRESS_BOOK',
      payload: isShow,
    });
  }, []);

  const addressBookConfirmed = (name: string, address: string, remarks: string) => {
    callSetAddressBookItemService(msgNode, {
      name,
      address,
      remarks,
    });
    Toast.show({
      icon: 'success',
      content: formatMessage({ id: 'TOAST.UPDATE' }),
    });

    showAddressBookDetail(false);
  };
  const addressBookCancel = () => {
    showAddressBookDetail(false);
  };

  const changeActiveTab = useCallback((key: string) => {
    dispatch({
      type: 'SET_ACTIVE_TAB',
      payload: key,
    });
  }, []);

  // get address by search key
  const getSearchResult = (keyWords: string) => {
    try {
      const keyWordsUpperCase = keyWords.toUpperCase();
      const addressBook: AddressCollection = {};
      const myAccount: AddressCollection = {};
      const recentReceiver: AddressCollection = {};

      for (const item in showAddressMapAddress) {
        const source = showAddressMapAddress[item].source;
        if (source === 'addressBook') {
          addressBook[item] = showAddressMapAddress[item];
        } else if (source === 'myAccount') {
          myAccount[item] = showAddressMapAddress[item];
        } else {
          recentReceiver[item] = showAddressMapAddress[item];
        }
      }

      const searchResult: Address[] = [];
      // chinese start from 1, english from 2
      // eslint-disable-next-line no-control-regex
      if (keyWords.replace(/[^\u0000-\u00ff]/g, 'aa').length >= 2) {
        // addressBook > myAccount > recentReceiver
        [addressBook, myAccount, recentReceiver].map((searchSource) => {
          // search name
          for (const item in searchSource) {
            const searchSourceItem = searchSource[item];
            if (!searchSourceItem) {
              continue;
            }

            const isSame = searchSourceItem.name.toUpperCase() === keyWordsUpperCase;
            const nameIndex = searchSourceItem.name.toUpperCase().indexOf(keyWordsUpperCase);
            const notExist = !searchResult.find((result) => {
              return result.address === searchSourceItem.address;
            });

            if (nameIndex !== -1 && notExist) {
              // handle recent receiver name equal address
              if (isSame && searchSourceItem.name === searchSourceItem.address) {
                continue;
              }
              // if first word paired, show on top
              if (nameIndex === 0) {
                searchResult.unshift(searchSourceItem);
              } else {
                searchResult.push(searchSourceItem);
              }
            }
          }

          // search address
          for (const item in searchSource) {
            const searchSourceItem = searchSource[item];
            if (!searchSourceItem) {
              continue;
            }

            const upperCaseAddress = searchSourceItem?.address.toUpperCase();
            const isSame = upperCaseAddress === keyWordsUpperCase;
            const isInclude = upperCaseAddress.indexOf(keyWordsUpperCase) !== -1;
            const notExist = !searchResult.find((result) => {
              return result.address === searchSourceItem.address;
            });

            if (isInclude && notExist) {
              // handle recent receiver name equal address
              if (isSame && searchSourceItem.name === searchSourceItem.address) {
                continue;
              }

              searchResult.push(searchSource[item]);
            }
          }
        });
      }

      dispatch({
        type: 'SET_SEARCH_RESULT',
        payload: new Set(searchResult),
      });
    } catch (error) {
      log.info('getSearchResult error', error);
    }
  };

  // check receiver address rules, and get input status and tips
  const checkReceiverAddress = async (realAddress: string) => {
    try {
      let status = '';
      let tips = '';
      if (realAddress.length === 0) {
        dispatch({
          type: 'SET_SHOW_ADDRESS_STATUS',
          payload: {
            status,
            tips,
          },
        });

        return;
      }

      if (!TronWeb.isAddress(realAddress)) {
        status = 'error';
        tips = 'ACCOUNT.SEND.TIPS_INVALID_ACCOUNT';
      } else if (realAddress === selectedAddress) {
        status = 'error';
        tips = 'EXCEPTION.SEND.ADDRESS_SAME_ERROR';
        // check is black hole address
      } else if (BLACK_HOLE_ADDRESS.includes(realAddress)) {
        status = 'warn';
        tips = 'ACCOUNT.SEND.TIPS_TRX_ACCOUNT';
      } else {
        const { type } =
          (await getTokenById(selectedTokenId, selectedNode, selectedAddress, formatMessage)) ?? {};
        let account, chainParametersObj;
        account = (await tronWebInstance.trx.getUnconfirmedAccount(realAddress)) ?? {};
        chainParametersObj = await tronWebInstance.trx.getChainParameters();
        const chainParameters = _.keyBy(chainParametersObj, 'key');

        // check address is active
        if (!account.address) {
          if (type === 5) {
            status = 'info';
            tips = 'WARN.SEND.ADDRESS_UNACTIVATED_TRC721_WARN';
          } else if (type === 2) {
            status = 'info';
            tips = 'WARN.SEND.ADDRESS_UNACTIVATED_TRC20_WARN';
          } else {
            const res = await getAccountResourcesByAddress(tronWebInstance, selectedAddress);
            const { netLimit, freeNetLimit, NetUsedOnly } = res.data;
            const useBandWidth = netLimit - (freeNetLimit || 0) - NetUsedOnly;
            const createNewAccountFeeInSystemContract =
              chainParameters?.getCreateNewAccountFeeInSystemContract?.value ?? 0;
            if (useBandWidth >= 200 && createNewAccountFeeInSystemContract === 0) {
              status = 'info';
              tips = 'WARN.SEND.ADDRESS_UNACTIVATED_NET_WARN';
            } else {
              const createNewAccountFee = new BigNumber(createNewAccountFeeInSystemContract);
              const createAccountFee = chainParameters?.getCreateAccountFee?.value ?? 0;
              status = 'info';
              tips = 'WARN.SEND.ADDRESS_UNACTIVATED_WARN';
              const createAccountCost = useBandWidth
                ? createNewAccountFee.shiftedBy(-6).toFixed()
                : createNewAccountFee.plus(createAccountFee).shiftedBy(-6).toFixed();
              dispatch({
                type: 'SET_CREATE_ACCOUNT_COST',
                payload: createAccountCost,
              });
            }
          }
        }
        // check is contract
        if (account.type === 'Contract') {
          status = 'warn';
          tips = 'ACCOUNT.SEND.TIPS_CONTRACT_ACCOUNT';
        }
      }

      dispatch({
        type: 'SET_SHOW_ADDRESS_STATUS',
        payload: {
          status,
          tips,
        },
      });
    } catch (error) {
      log.info('checkReceiverAddress error', error);
    }
  };

  const checkShowAddAddressBook = () => {
    try {
      const { showAddress, inputStatus, myAccounts, addressBooks } = state;
      const { address } = showAddressMapAddress[showAddress] ?? {};
      const myAccountsAddress = Object.keys(myAccounts);
      const addressBooksAddress = Object.keys(addressBooks);

      // only when input address not in addressBook and myAccount, and input status is not error, show add address into addressBook button
      return (
        myAccountsAddress.indexOf(showAddress) === -1 &&
        addressBooksAddress.indexOf(showAddress) === -1 &&
        myAccountsAddress.indexOf(address) === -1 &&
        addressBooksAddress.indexOf(address) === -1 &&
        showAddress.length > 0 &&
        inputStatus !== 'error' &&
        inputStatus !== 'warn'
      );
    } catch (error) {
      log.info('checkShowAddAddressBook error ', error);
      return false;
    }
  };

  const onConfirm = async () => {
    const { showAddress } = state;
    const receiverAddress = showAddressMapAddress[showAddress] ?? {
      address: showAddress.trim(),
    };
    setGaEvent('Transfer', 'Change Transfer Address', 'Change Transfer Address');
    const selectedToken = await getTokenById(
      selectedTokenId,
      selectedNode,
      selectedAddress,
      formatMessage,
    );
    navigate(`${PAGES.PAGE_TRANSFER_STEP_2}`, {
      state: { receiverAddress, selectedToken, selectedCollection },
    });
  };

  return {
    state,
    setShowAddress,
    showAddressBookDetail,
    addressBookConfirmed: useCheckLoginBeforeAction(addressBookConfirmed),
    addressBookCancel,
    checkShowAddAddressBook,
    changeActiveTab,
    onConfirm: useCheckLoginBeforeAction(onConfirm),
  };
};

function setShowAddressMapAddress(
  showAddress: string,
  name: string,
  address: string,
  source: string,
) {
  if (!showAddressMapAddress[showAddress]) {
    showAddressMapAddress[showAddress] = { showAddress, name, address, source };
  }
}

function createShowAddress(name = '', address = ''): string {
  try {
    let showAddress = address;
    let shadowName = name;
    if (name.length > 12) {
      shadowName = cutMiddle(name, 6, 6);
    }
    showAddress = `${shadowName} (${cutMiddle(address, 6, 6)})`;

    return showAddress;
  } catch (error) {
    log.info('createShowAddress error', error);
    return address;
  }
}
