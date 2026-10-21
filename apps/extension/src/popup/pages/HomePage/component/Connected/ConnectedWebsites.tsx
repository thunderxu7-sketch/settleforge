import { FC, memo } from 'react';

import { useDeleteWebsites } from './hook';
import Websites from './components/Websites';
import DeleteDialog from './components/DeleteDialog';

import styles from './Connected.m.scss';

interface Props {
  name: string;
  isVisible: boolean;
  onClose: () => void;
}

const ConnectedWebsites: FC<Props> = ({ name, isVisible, onClose }) => {
  const { state, showDeleteDialog, hideDeleteDialog, disconnectWebsite } =
    useDeleteWebsites(onClose);
  if (!isVisible) {
    return null;
  }

  if (state.isDeleteDialogVisible) {
    return (
      <div className={styles.container}>
        <DeleteDialog
          hostname={state.toDeleteWebInfo?.hostname}
          onConfirm={disconnectWebsite}
          onCancel={hideDeleteDialog}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Websites name={name} onClose={onClose} onDelete={showDeleteDialog} />
    </div>
  );
};

export default memo(ConnectedWebsites);
