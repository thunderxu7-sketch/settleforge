import { FC, memo } from 'react';

import { useDeleteWebsites } from './hook';
import { useConnectedInfo } from '../../../../../hooks/conncted_info';
import NoAddress from './components/NoAddress';
import AddressList from './components/AddressList';
import styles from './Connected.m.scss';
import DeleteDialog from './components/DeleteDialog';

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

const ConnectedAddresses: FC<Props> = ({ isVisible, onClose }) => {
  const { state, showDeleteDialog, hideDeleteDialog, disconnectWebsiteForAddress } =
    useDeleteWebsites(onClose);

  const { tabInfo, connectedCount, connectedAccounts, isSysWhiteWebSite } = useConnectedInfo();

  if (!isVisible) {
    return null;
  }

  if (state.isDeleteDialogVisible) {
    return (
      <div className={styles.container}>
        <DeleteDialog
          hostname={state.toDeleteWebInfo?.hostname}
          onConfirm={disconnectWebsiteForAddress}
          onCancel={hideDeleteDialog}
        />
      </div>
    );
  }

  if (connectedCount == 0) {
    return <NoAddress tabInfo={tabInfo} onClose={onClose} />;
  }

  return (
    <AddressList
      tabInfo={tabInfo}
      onClose={onClose}
      connectedCount={connectedCount}
      connectedAccounts={connectedAccounts}
      isSysWhiteWebSite={isSysWhiteWebSite}
      onDisconnect={showDeleteDialog}
    />
  );
};

export default memo(ConnectedAddresses);
