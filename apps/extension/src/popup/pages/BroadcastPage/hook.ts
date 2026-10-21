import _ from 'lodash';
import log from 'loglevel';
import { useIntl } from 'react-intl';
import { useNavigate, useLocation } from 'react-router';

import { useAppSelector } from '../../../store/hooks';
import { selectAddressInfo } from '../../../store/slices/address_info';
import { useSaveLatestLocation } from '../../../hooks/location';
import PAGES from '../../../constants/pages';
import {
  getTransactionsByTronLinkServer,
  getCollectionRecordsByTronLinkServer,
} from '../../../service/local_data_service';

import Toast from '../../../components/Toast';

export const useBroadCastBiz = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const location = useLocation();
  const { txId, selectedToken } = (location.state as any) ?? {};

  const { type, id, contractAddress } = selectedToken;
  const tokenId = type === 5 || type === 2 ? contractAddress : id;

  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo?.selectedAddress ?? '';

  useSaveLatestLocation();

  const generateTransactionDetail = async () => {
    const { data } = await getTransactionsByTronLinkServer(selectedAddress, tokenId);
    const transactionDetail = _.get(data, 'records', []).find((item: any) => {
      return item.hash === txId;
    });

    return transactionDetail;
  };

  const generateCollectionTransactionDetail = async () => {
    const { data } = await getCollectionRecordsByTronLinkServer(selectedAddress, tokenId);
    const transactionDetail = _.get(data, 'records', []).find((item: any) => {
      return item.hash === txId;
    });

    return transactionDetail;
  };

  // avoid don't get transaction
  const loopGenerateTransactionDetail = () => {
    return new Promise((resolve) => {
      let timerAmount = 0;
      let transactionDetail: any;
      const timer = setInterval(async () => {
        timerAmount++;
        try {
          if (type === 5) {
            transactionDetail = await generateCollectionTransactionDetail();
          } else {
            transactionDetail = await generateTransactionDetail();
          }
        } catch (error) {
          log.info('loopGenerateTransactionDetail error: ', error);
        }

        if (transactionDetail || timerAmount > 4) {
          clearInterval(timer);
          resolve(transactionDetail);
        }
      }, 1000);
    });
  };

  const goTransactionDetail = async () => {
    Toast.show({
      icon: 'loading',
      content: '',
      duration: 0,
    });
    const transactionDetail = await loopGenerateTransactionDetail();
    Toast.hide();

    if (!transactionDetail) {
      Toast.show({
        content: formatMessage({ id: 'TRANSACTIONS.CONFIRM.DESC' }),
        duration: 2000,
      });
      setTimeout(() => {
        navigate(PAGES.PAGE_HOMEPAGE);
      }, 2000);
    } else {
      navigate(PAGES.PAGE_TRANSFER_DETAIL, {
        state: {
          txId,
          selectedToken,
        },
      });
    }
  };

  const goHomePage = () => {
    navigate(PAGES.PAGE_HOMEPAGE);
  };

  const goTransfer = () => {
    navigate(`${PAGES.PAGE_TRANSFER_STEP_1}`);
  };

  return {
    txId,
    goHomePage,
    goTransactionDetail,
    goTransfer,
  };
};
