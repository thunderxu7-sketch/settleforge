import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
// @ts-ignore
import bip39 from 'bip39';
// @ts-ignore
import * as bip32 from 'bip32';
// @ts-ignore
import TronWeb from 'tronweb';

import Toast from '../../../components/Toast';
import { useAddressInfo } from '../../../hooks/address_info';
import { useInputPassword } from '../../../components/InputPassword';
import { callGetUniqueNameService } from '../../../service/get_unique_name_service';
import { msgNode } from '../../inst';
import { callCreateMnemonicAccountsService } from '../../../service/create_mnemonic_accounts_service';
import { useNavigate } from 'react-router';
import PAGES from '../../../constants/pages';
import { callUpdateCheckAuthedService } from '../../../service/update_check_authed_service';
import { setGaEvent } from '../../utils/gaUtils';
import { getAccountInfo, setAccountInfo } from '../../../hooks/account_info';
import { supportStorageKey, WALLET_EXPORT_TYPE } from '../../../constants/wallet_type';
import { callUpdateAccountRemindStatusService } from '../../../service/update_account_remind_status_service';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

export const useCreateWalletBiz = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [isNameError, setNameError] = useState<boolean>(false);
  const [defaultName, setDefaultName] = useState('');

  const {
    password,
    confirmPassword,
    isValidPassword,
    isSamePassword,
    isNeedPassword,

    onChangePasswordState,
  } = useInputPassword();

  const [createSuccess, setCreateSuccess] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const { checkNameExist } = useAddressInfo();

  // initialize
  useEffect(() => {
    (async () => {
      const { name } = await callGetUniqueNameService(msgNode, {
        name: formatMessage({ id: 'CREATION.WALLET.NAME' }),
        idKey: 'commonName',
      });

      const createBackup = await getAccountInfo(supportStorageKey.createWalletBackup);

      const isNeedBackup = createBackup === 'true';

      setName(name);
      setDefaultName(name);
      setCreateSuccess(isNeedBackup);
    })();
  }, [formatMessage]);

  useEffect(() => {
    const trimmedName = name.trim();
    const length = trimmedName.length;
    if (length < 2 || length > 14) {
      setNameError(true);
    } else {
      setNameError(false);
    }
  }, [name]);

  const submitWalletInfo = useCallback(async () => {
    if (isNameError) {
      return;
    }

    if (isCreatingAccount) {
      return;
    }
    setIsCreatingAccount(true);
    Toast.show({
      icon: 'loading',
    });

    const trimmedName = name.trim();
    if (checkNameExist(trimmedName)) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'WALLET.IMPORT.NAME_REPEAT.ERROR' }),
      });
      return;
    }

    if ((isNeedPassword && isSamePassword && isValidPassword) || !isNeedPassword) {
      const mnemonic = bip39.generateMnemonic(128);
      const { address } = getAccountBySeq(mnemonic);
      try {
        await callCreateMnemonicAccountsService(msgNode, {
          name: trimmedName,
          mnemonic,
          password,
          accounts: [
            {
              address,
              accountIndex: 0,
              addressIndex: 0,
            },
          ],
          idKey: 'commonName',
        });

        await callUpdateAccountRemindStatusService(msgNode, {
          address,
          remind: true,
        });
        await callUpdateCheckAuthedService(msgNode);
        await setAccountInfo(supportStorageKey.createWalletBackup, 'true');
        setCreateSuccess(true);
        setGaEvent('Create Wallet', 'Create Wallet Success', 'Create Wallet Success');
      } catch (e: any) {
        Toast.show({
          icon: 'fail',
          content: formatMessage({ id: e.message }),
        });
      } finally {
        setIsCreatingAccount(false);
        Toast.hide();
      }
    }
  }, [
    isNeedPassword,
    isSamePassword,
    isValidPassword,
    name,
    password,
    formatMessage,
    checkNameExist,
    isNameError,
    isCreatingAccount,
  ]);

  const toSave = useCallback(async () => {
    await setAccountInfo(supportStorageKey.exportType, WALLET_EXPORT_TYPE.MNEMONIC);
    await setAccountInfo(supportStorageKey.fromPage, PAGES.PAGE_CREATE_WALLET);
    navigate(PAGES.PAGE_SAVE_MNEMONIC);
  }, [navigate]);

  const onChangeName = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const trimmed = e.target.value.replace(/\s{2,}/g, ' ');
    setName(trimmed);
  }, []);

  return {
    name,
    defaultName,
    onChangeName,
    isNameError,

    password,
    confirmPassword,
    isValidPassword,
    isSamePassword,
    isNeedPassword,
    onChangePasswordState,

    createSuccess,

    submitWalletInfo: useCheckLoginBeforeAction(submitWalletInfo),
    toSave: useCheckLoginBeforeAction(toSave),
  };
};

export function getAccountBySeq(mnemonic: string, index = 0) {
  const seed = bip39.mnemonicToSeed(mnemonic);
  const node = bip32.fromSeed(seed);
  const child = node.derivePath(`m/44'/195'/0'/0/${index}`);
  const privateKey = child?.privateKey?.toString('hex');
  const address = TronWeb.address.fromPrivateKey(privateKey);

  return {
    privateKey,
    address,
  };
}
