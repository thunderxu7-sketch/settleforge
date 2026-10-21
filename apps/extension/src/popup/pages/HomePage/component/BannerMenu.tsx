import { FC, memo, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';
import classNames from 'classnames';

import { useSelectedNodeInfo } from '../../../../hooks/selected_node_info';
import { useTronWebInstance } from '../../../../hooks/tronweb_popup';
import { useAppSelector } from '../../../../store/hooks';
import { selectAddressInfo } from '../../../../store/slices/address_info';
import PAGES from '../../../../constants/pages';
import PreventTransferModal from '../../../../components/PreventTransferModal';
import { checkAddressActive } from '../../../utils/assetUtils';
import { setGaEvent } from '../../../utils/gaUtils';
import { FuncCheckAndShowRemindModal } from '../../../../components/RemindModal';

import styles from '../HomePage.m.scss';
import Toast from '../../../../components/Toast';

interface Props {
  checkAndShowRemindModal: FuncCheckAndShowRemindModal;
}

const HomePageBannerMenu: FC<Props> = ({ checkAndShowRemindModal }) => {
  const intl = useIntl();
  const navigate = useNavigate();

  const { selectedNodeInfo } = useSelectedNodeInfo();
  const { tronWebInstance } = useTronWebInstance();
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo?.selectedAddress ?? '';

  const [showPreventTransferModal, setShowPreventTransferModal] = useState(false);

  const navigateToRecieve = useCallback(async () => {
    const res = await checkAndShowRemindModal(1);
    if (res) {
      return;
    }

    setGaEvent('Home', 'Click Receive', 'Click Receive');
    navigate(PAGES.PAGE_RECEIVE);
  }, [navigate, checkAndShowRemindModal]);

  const navigateToTransfer = useCallback(async () => {
    const res = await checkAndShowRemindModal(1);
    if (res) {
      return;
    }
    try {
      Toast.show({
        icon: 'loading',
        duration: 0,
      });
      const isOnlineAddress = await checkAddressActive(tronWebInstance, selectedAddress);

      Toast.hide();

      if (!isOnlineAddress) {
        setShowPreventTransferModal(true);
        return;
      }
      setGaEvent('Home', 'Click Send', 'Click Send');
      navigate(`${PAGES.PAGE_TRANSFER_STEP_1}`);
    } catch (error) {
      Toast.hide();
    }
  }, [navigate, tronWebInstance, selectedAddress, checkAndShowRemindModal]);

  const navigateToVote = useCallback(() => {
    setGaEvent('Account Management', 'Click Vote', 'Click Vote');
    const url = selectedNodeInfo!.voteUrl;
    window.open(url);
  }, [selectedNodeInfo]);

  const navigateToFreeze = useCallback(() => {
    setGaEvent('Account Management', 'Click Freeze / Unfreeze', 'Click Freeze / Unfreeze');
    const url = selectedNodeInfo!.freezeUrl;
    window.open(url);
  }, [selectedNodeInfo]);

  const navigateToDappList = useCallback(() => {
    setGaEvent('Dapp List', 'Recommend', 'Recommend');
    navigate(PAGES.PAGE_DAPPLIST);
    setGaEvent('Home', 'Click Dapp', 'Click Dapp');
  }, [navigate]);

  return (
    <>
      <div className={classNames(styles.flSp, styles.bannerMenuBox)}>
        <div
          className={classNames(styles.flCol, styles.flAcent, styles.bmItem, styles.transfer)}
          onClick={navigateToTransfer}
        >
          <span className={styles.bannerMenuIcon}></span>
          <span className={styles.bannerMenuText}>
            {intl.formatMessage({ id: 'CONFIRMATIONS.TYPE.TRANSFER' })}
          </span>
        </div>

        <div
          className={classNames(styles.flCol, styles.flAcent, styles.bmItem, styles.collection)}
          onClick={navigateToRecieve}
        >
          <span className={classNames(styles.bannerMenuIcon)}></span>
          <span className={styles.bannerMenuText}>
            {intl.formatMessage({ id: 'ACCOUNT.TYPE.RECEIVE' })}
          </span>
        </div>

        <div
          className={classNames(styles.flCol, styles.flAcent, styles.bmItem, styles.deposit)}
          onClick={navigateToFreeze}
        >
          <span className={styles.bannerMenuIcon}></span>
          <span className={styles.bannerMenuText}>
            {intl.formatMessage({ id: 'CONFIRMATIONS.NEW.FUNCTION.FREEZE' })}
          </span>
        </div>

        <div
          className={classNames(styles.flCol, styles.flAcent, styles.bmItem, styles.vote)}
          onClick={navigateToVote}
        >
          <span className={styles.bannerMenuIcon}></span>
          <span className={styles.bannerMenuText}>
            {intl.formatMessage({ id: 'CONFIRMATIONS.NEW.FUNCTION.VOTE' })}
          </span>
        </div>

        <div
          className={classNames(styles.flCol, styles.flAcent, styles.bmItem, styles.more)}
          onClick={navigateToDappList}
        >
          <span className={styles.bannerMenuIcon}></span>
          <span className={styles.bannerMenuText}>
            {intl.formatMessage({ id: 'ACCOUNT.MORE' })}
          </span>
        </div>
      </div>
      <PreventTransferModal
        showModal={showPreventTransferModal}
        setShowModal={setShowPreventTransferModal}
      />
    </>
  );
};

export default memo(HomePageBannerMenu);
