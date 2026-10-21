import { FC, memo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { FormattedMessage } from 'react-intl';

import PAGES from '../../../../constants/pages';
import { setGaEvent } from '../../../utils/gaUtils';

import styles from '../HomePage.m.scss';

interface Props {
  nodeList: Record<string, any>;
  selectedNode: string;
  accountType: number;
  userAddress: string;

  showConnectedWebsites: () => void;
  showNameModal: () => void;
  showDeleteAddress: () => void;
  setMenuListVisible: (visible: boolean) => void;
}

const MenuList: FC<Props> = ({
  nodeList,
  selectedNode,
  accountType,
  userAddress,
  setMenuListVisible,
  showNameModal,
  showDeleteAddress,
  showConnectedWebsites,
}) => {
  const navigate = useNavigate();

  const openTronscanContractApproval = () => {
    const hostname = nodeList[selectedNode]?.hostname;
    const url = `${hostname}/balanceView/${userAddress}/approval?from=tronlink`;
    setMenuListVisible(false);
    window.open(url);
  };

  const openModifyAccountName = () => {
    showNameModal();
    setMenuListVisible(false);
  };

  const exportAccount = useCallback(() => {
    navigate(PAGES.PAGE_EXPORT_ACCOUNT);
  }, [navigate]);

  const openDeleteAccount = () => {
    showDeleteAddress();
    setMenuListVisible(false);
    setGaEvent('Account Management', 'Click Delete Account', 'Click Delete Account');
  };

  const openAddressBook = useCallback(() => {
    navigate(`${PAGES.PAGE_ADDRESS_BOOK}/list`);
  }, [navigate]);

  const openSettings = useCallback(() => {
    setGaEvent('Home', 'Click Setting', 'Click Setting');
    navigate(PAGES.PAGE_SETTINGS);
  }, [navigate]);

  return (
    <div className={styles.menuList}>
      {/*<div className={styles.linkedAccount}>*/}
      {/*  <FormattedMessage id="HD.ACCOUNTS" />*/}
      {/*</div>*/}
      <p onClick={showConnectedWebsites} className={styles.connectionManage}>
        <FormattedMessage id="ACCOUNT.AUTH_WEBSITE.CONNECT_MANAGER" />
      </p>
      <p className={styles.contractAuthorization} onClick={openTronscanContractApproval}>
        <FormattedMessage id="ACCOUNT.CONTRACT_APPROVAL" />
      </p>
      <p className={styles.modifyAccountName} onClick={openModifyAccountName}>
        <FormattedMessage id="MENU.UPDATE_NAME" />
      </p>
      {accountType !== 2 && (
        <p className={styles.exportAccount} onClick={exportAccount}>
          <FormattedMessage id="ACCOUNTS.EXPORT" />
        </p>
      )}
      <p className={styles.deleteAccount} onClick={openDeleteAccount}>
        <FormattedMessage id="ACCOUNTS.CONFIRM_DELETE" />
      </p>
      <p className={styles.addressBook} onClick={openAddressBook}>
        <FormattedMessage id="SETTING.TITLE.ADDRESS_BOOK" />
      </p>
      <div className={styles.divideLine}></div>
      <p className={styles.settings} onClick={openSettings}>
        <FormattedMessage id="PAGES.SETTINGS" />
      </p>
    </div>
  );
};

export default memo(MenuList);
