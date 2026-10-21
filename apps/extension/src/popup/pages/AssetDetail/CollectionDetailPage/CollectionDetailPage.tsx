import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { FormattedMessage } from 'react-intl';
import { Button } from 'antd';
import classNames from 'classnames';

import { useSelectedNodeInfo } from '../../../../hooks/selected_node_info';
import { useSaveLatestLocation } from '../../../../hooks/location';
import NavBar from '../../../../components/NavBar/NavBar';
import { RemindModal, useRemindModal } from '../../../../components/RemindModal';
import PreventTransferModal from '../../../../components/PreventTransferModal';
import { useTronWebInstance } from '../../../../hooks/tronweb_popup';
import { useSelectedAddressItem } from '../../../../hooks/selected_address_item';
import { checkAddressActive } from '../../../utils/assetUtils';
import PAGES from '../../../../constants/pages';
import Image from '../../../../components/Image';

import styles from './CollectionDetailPage.m.scss';

import nftDefault from './images/token_721_default.svg';

const CollectionDetailPage = () => {
  useSaveLatestLocation();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedToken, selectedCollection } = (location.state as any) ?? {};
  const { shortName, contractAddress, transferStatus } = selectedToken;
  const { assetId, imageUrl, logoUrl, name, intro, tokenAddress } = selectedCollection;
  const imgUrl = imageUrl || logoUrl || nftDefault;

  const { tronWebInstance } = useTronWebInstance();
  const { selectedAddressItem } = useSelectedAddressItem();
  const selectedAddress = selectedAddressItem?.address;

  const { selectedNodeInfo } = useSelectedNodeInfo();

  const {
    isRemindModalVisible,
    checkAndShowRemindModal,
    onRemindModalCancel,
    onRemindModalConfirm,
  } = useRemindModal();

  const preventTransferModal = async () => {
    const isOnlineAddress = await checkAddressActive(tronWebInstance, selectedAddress);
    if (!isOnlineAddress) {
      setShowModal(true);
    } else {
      navigate(`${PAGES.PAGE_TRANSFER_STEP_1}`, {
        state: { selectedTokenId: tokenAddress, selectedCollection },
      });
    }
  };

  const navigateToTronscan = () => {
    const host = selectedNodeInfo?.hostname;
    if (host) {
      const url = `${host}/token20/${contractAddress}/${assetId}`;
      window.open(url);
    }
  };

  return (
    <div className={styles.collectionDetail} id="collectionDetail">
      <RemindModal
        isVisible={isRemindModalVisible}
        type={1}
        onConfirm={onRemindModalConfirm}
        onCancel={onRemindModalCancel}
      />
      <NavBar
        title={<span className={styles.title}>{`${shortName} #${assetId}`}</span>}
        rightElement={
          <div
            className={styles.navDetail}
            onClick={() => {
              navigateToTronscan();
            }}
          >
            <FormattedMessage id="TRANSACTION.TOKEN_INFO.DETAILS" />
          </div>
        }
      />

      <div className={styles.content}>
        <div className={styles.collectionImg}>
          <Image defaultSrc={nftDefault} src={imgUrl} alt="" />
        </div>
        <p className={classNames(styles.name, name && styles.black)}>{name}</p>
        <p className={classNames(styles.assetId, !name && styles.black)}>#{assetId}</p>
        {intro && intro.length > 0 && (
          <div className={styles.desc}>
            <p className={styles.head}>
              <FormattedMessage id="ASSET.COLLECTION.INTRO" />
            </p>
            <p className={styles.text}>{intro}</p>
          </div>
        )}

        <Button
          disabled={!transferStatus}
          onClick={async () => {
            const res = await checkAndShowRemindModal(1);
            if (res) {
              return;
            }
            preventTransferModal();
          }}
        >
          <i className={styles.send}></i>
          <FormattedMessage id="ACCOUNT.TYPE.SEND_COLLECTION" />
        </Button>
      </div>

      <PreventTransferModal showModal={showModal} setShowModal={setShowModal} />
    </div>
  );
};

export default CollectionDetailPage;
