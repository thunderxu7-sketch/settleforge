import { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { msgNode } from '../../inst';
import { callGetDAppListService } from '../../../service/get_dapp_list_service';
import { useAppSelector } from '../../../store/hooks';
import { selectDAppList } from '../../../store/slices/dapp_list';
import { useSaveLatestLocation } from '../../../hooks/location';
import { FRONT_API_TIME_OUT } from '../../../constants/api';

import Toast from '../../../components/Toast';

export const useDAppListBiz = () => {
  const dappList = useAppSelector(selectDAppList);
  useSaveLatestLocation();
  const { formatMessage } = useIntl();

  useEffect(() => {
    (async () => {
      const { success, error } = await callGetDAppListService(msgNode);
      if (!success && error && error.indexOf(FRONT_API_TIME_OUT) !== -1) {
        Toast.show({
          icon: 'fail',
          content: formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
          duration: 3000,
        });
      }
    })();
  }, []);

  return {
    dappList,
  };
};
