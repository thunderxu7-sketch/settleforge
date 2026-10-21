import { ChangeEvent, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import log from 'loglevel';

import { msgNode } from '../../../../inst';
import Toast from '../../../../../components/Toast';
import { useAddressInfo } from '../../../../../hooks/address_info';
import { callUpdateNameService } from '../../../../../service/update_name_service';
import PAGES from '../../../../../constants/pages';
import { useNavigate } from 'react-router';

export const useUpdateName = (selectedAccount: any, toggleVisible: any) => {
  const { formatMessage } = useIntl();
  const [accountName, setAccountName] = useState<string>('');
  const [hasLength, setHasLength] = useState<boolean>(false);
  const [isUnique, setIsUnique] = useState<boolean>(false);
  const [isCriteria, setIsCriteria] = useState<boolean>(false);

  const { checkNameExist } = useAddressInfo();
  const navigate = useNavigate();

  const onChangeName = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const trimmed = e.target.value.replace(/\s{2,}/g, ' ');
      setAccountName(trimmed);
      const trimmedAll = trimmed.trim();
      if (trimmedAll) {
        setIsCriteria(true);
      } else {
        setIsCriteria(false);
      }
      if (trimmedAll && trimmedAll.length >= 2) {
        setHasLength(true);
      } else {
        setHasLength(false);
      }

      if (checkNameExist(trimmedAll)) {
        setIsUnique(false);
      } else {
        setIsUnique(true);
      }
    },
    [checkNameExist],
  );

  const submit = useCallback(async () => {
    if (!hasLength || !isUnique) {
      return;
    }
    try {
      const res = await callUpdateNameService(msgNode, {
        address: selectedAccount?.address,
        name: accountName.trim(),
      }).catch((error) => {
        if (error.message === 'ERRORS.INVALID_PASSWORD_RETRY') {
          navigate(PAGES.PAGE_LOGIN);
        }
      });
      if (res) {
        Toast.show({
          icon: 'success',
          content: formatMessage({
            id: 'TOAST.UPDATE_NAME',
          }),
        });
        setAccountName('');
        setHasLength(false);
        setIsUnique(false);
        setIsCriteria(false);
        toggleVisible();
      }
    } catch (error) {
      log.error(error);
    }
  }, [accountName, hasLength, isUnique, selectedAccount?.address]);

  const cancel = () => {
    toggleVisible();
    setAccountName('');
    setIsCriteria(false);
  };

  return {
    accountName,
    isCriteria,
    onChangeName,
    hasLength,
    isUnique,
    submit,
    cancel,
  };
};
