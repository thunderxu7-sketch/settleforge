import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';
import log from 'loglevel';
import _ from 'lodash';
// @ts-ignore
import TronWeb from 'tronweb';

import { callCreatePrivateAccountsService } from '../../../service/create_private_key_accounts_service';
import {
  clearImportWalletInfo,
  getImportWalletRouteParams,
  setImportWalletRouteParams,
} from '../../../service/importWalletInfo';
import {
  decryptString,
  decryptSync,
  getWordList,
  isKeystoreWallet,
  validateMnemonic,
  validatePrivateKey,
} from './utils';
import { msgNode } from '../../inst';
import { supportStorageKey, WALLET_IMPORT_TYPE } from '../../../constants/wallet_type';
import { useInputPassword } from '../../../components/InputPassword';
import PAGES from '../../../constants/pages';
import Toast from '../../../components/Toast';
import { setGaEvent } from '../../utils/gaUtils';
import { getAccountInfo } from '../../../hooks/account_info';
import { callGetUniqueNameService } from '../../../service/get_unique_name_service';
import { useAddressInfo } from '../../../hooks/address_info';
import { callUpdateCheckAuthedService } from '../../../service/update_check_authed_service';
import { useGlobalIsAuthed } from '../../../hooks/auth';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

export const useImportWalletBiz = () => {
  const { checkNameExist, addressInfo } = useAddressInfo();
  const existAccounts: any = addressInfo?.addressItems;
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const {
    password,
    confirmPassword,
    isValidPassword,
    isSamePassword,
    isNeedPassword,
    onChangePassword,
    onChangePasswordState,
  } = useInputPassword();

  const [fromPage, setFromPage] = useState<string>('');
  const [importName, setImportName] = useState('');
  const [isNameError, setNameError] = useState<boolean>(false);
  const [originText, setOriginText] = useState('');
  const [flatList, setFlatList] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState('');
  const [importType, setImportType] = useState('');

  const isAuthed = useGlobalIsAuthed();

  useEffect(() => {
    if (isAuthed && fromPage === PAGES.PAGE_GUIDE) {
      navigate(PAGES.PAGE_HOMEPAGE, { replace: true });
    }
  }, [navigate, isAuthed, fromPage]);

  // initialize
  useEffect(() => {
    (async () => {
      const fromPage = await getAccountInfo(supportStorageKey.fromPage);

      const data = getImportWalletRouteParams() || {};
      const { originText = '' } = data;
      //const originText: string = await chromeStorage.getItem(IMPORT_WALLET_STRING);

      const { name } = await callGetUniqueNameService(msgNode, {
        name: formatMessage({ id: 'CREATION.WALLET.NAME_IMPORT' }),
        idKey: 'importName',
      });

      setOriginText(originText);
      setImportName(name);
      setFromPage(fromPage);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //Check the WALLET_IMPORT_TYPE by the Textarea
  useEffect(() => {
    let type = WALLET_IMPORT_TYPE.MNEMONIC;
    const trimText = _.trim(originText);
    if (_.startsWith(trimText, '{') && _.endsWith(trimText, '}')) {
      type = WALLET_IMPORT_TYPE.KEYSTORE;
    } else if (/^(0x|)[a-fA-F0-9]+$/.test(originText)) {
      type = WALLET_IMPORT_TYPE.PRIVATE_KEY;
    }
    setImportType(type);
  }, [originText]);

  useEffect(() => {
    const tmpFlatList: string[] = [];
    let msg = '';
    let text = _.trimStart(originText.replaceAll(/\s+/g, ' '));
    if (_.startsWith(text, '{')) {
      // ignore
    } else if (
      (_.size(_.trim(text)) > 10 && !/[,;\\/\\、\-，；\s]+|\.|\|/g.test(text)) ||
      /\d/.test(text)
    ) {
      text = _.trim(text);
      const address = TronWeb.address.fromPrivateKey(text);
      if (text.includes(' ') || !/^(0x|)[a-fA-F0-9]+$/.test(text) || _.size(text) > 64) {
        msg = formatMessage({ id: 'WALLET.IMPORT.PRIVATEKEY.ERROR_TIP' });
      } else if (!address || !TronWeb.isAddress(address)) {
        msg = formatMessage({ id: 'EXCEPTION.FORMAT_ERROR' });
      }
    } else if (_.size(text) > 0) {
      text = text.replaceAll(/[,;\\/\\、\-，；]+|\.|\|/g, ' ');
      text = _.trimStart(text.replaceAll(/\s+/g, ' '));
      const textArr: string[] = _.split(text, ' ');
      const lastWord: string = textArr.pop()!;
      const wordList = getWordList();
      for (const w of textArr) {
        if (!wordList.includes(w)) {
          msg = formatMessage({ id: 'WALLET.IMPORT.MNEMONIC.ERROR_TIP' });
          break;
        }
      }
      let isEqual = false;
      if (_.size(msg) === 0 && _.size(lastWord) > 0) {
        for (const word of wordList) {
          if (word === lastWord) {
            isEqual = true;
            continue;
          }
          if (_.size(tmpFlatList) < 5) {
            word.startsWith(lastWord) && tmpFlatList.push(word);
          } else {
            break;
          }
        }
      }
      if (!msg && _.size(lastWord) > 0 && _.size(tmpFlatList) === 0 && !isEqual) {
        msg = formatMessage({ id: 'WALLET.IMPORT.MNEMONIC.ERROR_TIP' });
      }
    }
    setImportWalletRouteParams({ originText: text });
    setOriginText(text);
    setFlatList(tmpFlatList);
    setMsg(msg);
    setStep(0);
  }, [originText, formatMessage]);

  const onSelectMnemonic = useCallback(
    (word: string) => {
      const originArr = _.split(originText, ' ');
      originArr.pop();
      originArr.push(word);
      const newOriginText = originArr.join(' ') + ' ';
      setOriginText(newOriginText);
    },
    [originText],
  );

  //Set the walletName
  const onInputName = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const trimmed = e.target.value.replace(/\s{2,}/g, ' ');
    setImportName(trimmed);
  }, []);

  useEffect(() => {
    const trimmedName = importName.trim();
    const length = trimmedName.length;
    if (length < 2 || length > 14) {
      setNameError(true);
    } else {
      setNameError(false);
    }
  }, [importName]);

  const onInputOriginText = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setOriginText(e.target.value);
  }, []);

  const onStep0Click = useCallback(() => {
    const originTextTrimmed: string = _.trim(originText);
    if (_.size(originTextTrimmed) === 0 || _.size(msg) > 0) {
      return;
    }

    if (importType === WALLET_IMPORT_TYPE.MNEMONIC) {
      const text = _.trim(originText.replaceAll(/\s+/g, ' '));
      const originArr = _.split(text, ' ');
      const isValid = validateMnemonic(text);
      if (!isValid) {
        setMsg(formatMessage({ id: 'EXCEPTION.FORMAT_ERROR_MNEMONIC' }));
        return;
      }
      if (_.size(originArr) !== 12 && _.size(originArr) !== 24) {
        setMsg(formatMessage({ id: 'WALLET.IMPORT.MNEMONIC.ERROR_TIP_2' }));
        return;
      }
      setGaEvent('Import Wallet', 'Click Import Mnemonic', 'Click Import Mnemonic');
    }
    setStep(1);
  }, [importType, originText, formatMessage, msg]);

  const onStep1Click = useCallback(async () => {
    const originTextTrimmed: string = _.trim(originText);
    const importNameTrimmed = _.trim(importName);
    if (
      _.size(originTextTrimmed) === 0 ||
      isNameError ||
      _.size(msg) > 0 ||
      (importType !== WALLET_IMPORT_TYPE.KEYSTORE &&
        isNeedPassword &&
        (!isSamePassword || !isValidPassword)) ||
      (importType === WALLET_IMPORT_TYPE.KEYSTORE && isNeedPassword && _.size(password) === 0)
    ) {
      return;
    }

    if (checkNameExist(importNameTrimmed)) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'WALLET.IMPORT.NAME_REPEAT.ERROR' }),
      });
      return;
    }

    if (importType === WALLET_IMPORT_TYPE.KEYSTORE) {
      const result = await addAccountByKeystore(
        existAccounts,
        formatMessage,
        originText,
        password,
        importNameTrimmed,
        isNeedPassword,
      );
      setGaEvent('Import Wallet', 'Click Keystore', 'Click Keystore');

      // for update authed state in the Routes, otherwise, it can't go to homepage
      if (result) {
        if (!isAuthed) {
          await callUpdateCheckAuthedService(msgNode);
        } else {
          navigate(PAGES.PAGE_HOMEPAGE);
        }
        clearImportWalletInfo();
      }
      return;
    }

    if (importType === WALLET_IMPORT_TYPE.MNEMONIC) {
      const text = _.trim(originText.replaceAll(/\s+/g, ' '));
      const originArr = _.split(text, ' ');
      const isValid = validateMnemonic(text);
      if (!isValid) {
        setMsg(formatMessage({ id: 'EXCEPTION.FORMAT_ERROR_MNEMONIC' }));
        return;
      }
      if (_.size(originArr) !== 12 && _.size(originArr) !== 24) {
        setMsg(formatMessage({ id: 'WALLET.IMPORT.MNEMONIC.ERROR_TIP_2' }));
        return;
      }
      setGaEvent('Import Wallet', 'Click Import Mnemonic', 'Click Import Mnemonic');
    }

    if (importType === WALLET_IMPORT_TYPE.PRIVATE_KEY && (1 & _.size(originText)) === 0) {
      const address = TronWeb.address.fromPrivateKey(originText);
      if (existAccounts[address]) {
        Toast.show({
          icon: 'fail',
          content: formatMessage({ id: 'CREATION.RESTORE.KEY_STORE.EXCEPTION.ACCOUNT_EXIST' }),
        });
        return;
      }
      const tmpAccounts = [
        {
          privateKey: originText,
          address,
        },
      ];

      const result = await addAccountByPrivateKey(
        originText,
        importType,
        importNameTrimmed,
        tmpAccounts,
        password,
      );
      if (result) {
        if (fromPage === PAGES.PAGE_GUIDE) {
          await callUpdateCheckAuthedService(msgNode);
        } else {
          navigate(PAGES.PAGE_HOMEPAGE);
        }
        clearImportWalletInfo();
      }
      setGaEvent('Import Wallet', 'Click Import Private Key', 'Click Import Private Key');
      return;
    }

    const importInfo = {
      type: importType,
      originText: _.trim(originText),
      name: importNameTrimmed,
      pathMode: 0,
      number: Buffer.from(password || '').toString('base64'),
      password: password,
    };
    setImportWalletRouteParams(importInfo);
    navigate(PAGES.PAGE_IMPORT_CONFIRM);
  }, [
    importType,
    importName,
    isNameError,
    password,
    originText,
    isSamePassword,
    isNeedPassword,
    checkNameExist,
    existAccounts,
    formatMessage,
    fromPage,
    isAuthed,
    isValidPassword,
    msg,
    navigate,
  ]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return {
    originText,
    flatList,
    msg,
    onInputOriginText,
    onStep0Click: useCheckLoginBeforeAction(onStep0Click),
    onStep1Click: useCheckLoginBeforeAction(onStep1Click),
    goBack,
    step,
    importName,
    isNameError,
    importType,
    onInputName,
    password,
    isSamePassword,
    isValidPassword,
    confirmPassword,
    isNeedPassword,
    onChangePassword,
    onChangePasswordState,
    onSelectMnemonic,
    setOriginText,
  };
};

const addAccountByPrivateKey = async (
  originText: any,
  type: string,
  name: string,
  accounts: any,
  password: string,
) => {
  try {
    return await callCreatePrivateAccountsService(msgNode, {
      name,
      password,
      accounts,
    });
  } catch (e: any) {
    log.info(e);
  }
};

const addAccountByKeystore = async (
  accountList: string,
  formatMessage: any,
  originText: any,
  password: string,
  name: string,
  isNeedPassword: boolean,
) => {
  try {
    Toast.show({
      icon: 'loading',
      duration: 5000,
    });
    const { key, address, salt, version } = JSON.parse(originText);
    if ((key && address && salt) || +version === 1) {
      const privateKey = decryptString(password, salt, key);
      if (
        validatePrivateKey(privateKey) &&
        TronWeb.utils.crypto.pkToAddress(privateKey) === address
      ) {
        if (accountList[address]) {
          Toast.show({
            icon: 'fail',
            content: formatMessage({
              id: 'CREATION.RESTORE.KEY_STORE.EXCEPTION.ACCOUNT_EXIST',
            }),
          });
          return;
        }
        const pwd = isNeedPassword ? password : '';
        await addAccountByPrivateKey(
          originText,
          WALLET_IMPORT_TYPE.PRIVATE_KEY,
          name,
          [
            {
              privateKey,
              address,
            },
          ],
          pwd,
        );
      } else {
        Toast.show({
          icon: 'fail',
          content: formatMessage({
            id: 'CREATION.RESTORE.KEY_STORE.EXCEPTION',
          }),
        });
      }
    } else if (isKeystoreWallet(originText)) {
      // standard
      const { address, privateKey } = decryptSync(originText, password, true);
      if (accountList[address]) {
        Toast.show({
          icon: 'fail',
          content: formatMessage({ id: 'CREATION.RESTORE.KEY_STORE.EXCEPTION.ACCOUNT_EXIST' }),
        });
        return;
      }
      const pwd = isNeedPassword ? password : '';
      try {
        return await addAccountByPrivateKey(
          '',
          WALLET_IMPORT_TYPE.PRIVATE_KEY,
          name,
          [
            {
              privateKey,
              address,
            },
          ],
          pwd,
        );
      } catch (e: any) {
        log.info(e);
      }
    } else {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'CREATION.RESTORE.KEY_STORE.EXCEPTION' }),
      });
    }
  } catch (e) {
    Toast.show({
      icon: 'fail',
      content: formatMessage({ id: 'CREATION.RESTORE.KEY_STORE.EXCEPTION' }),
    });
  }
};
