import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { useDeleteAddress } from './hook';
import { setGaEvent } from '../../../../utils/gaUtils';

import styles from './DeleteAddress.m.scss';

import deleteAddressImg from '../../images/delete_address.svg';
import onlyOneAddressImg from '../../images/onlyone_address.svg';

interface Props {
  visible: boolean;
  toggleVisible: () => void;
  updateDeleteAddress: (address: string) => Promise<void>;
  selectedAddress: string;
}

const DeleteAddress: FC<Props> = ({
  visible,
  toggleVisible,
  updateDeleteAddress,
  selectedAddress,
}) => {
  const { submit, isOnlyOne } = useDeleteAddress(
    visible,
    toggleVisible,
    updateDeleteAddress,
    selectedAddress,
  );

  return visible ? (
    <div className={styles.modalWrap}>
      {isOnlyOne ? (
        <div className={styles.modal}>
          <img src={onlyOneAddressImg} alt="" />
          <div className={styles.desc}>
            <FormattedMessage id="ALERT.DELETE_ACCOUNT.ONLY_ONE" />
          </div>
          <div className={styles.btnGroup}>
            <button className={classNames(styles.confirm, styles.large)} onClick={toggleVisible}>
              <FormattedMessage id={'BUTTON.CONFIRM'} />
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.modal}>
          <img src={deleteAddressImg} alt="" />
          <div className={styles.desc}>
            <FormattedMessage id="ACCOUNTS.CONFIRM_DELETE.BODY" />
          </div>
          <div className={styles.btnGroup}>
            <button
              className={styles.cancel}
              onClick={() => {
                toggleVisible();
                setGaEvent('Delete Account', 'Delete Account Cancel', 'Delete Account Cancel');
              }}
            >
              <FormattedMessage id={'BUTTON.CANCEL'} />
            </button>
            <button className={styles.confirm} onClick={submit}>
              <FormattedMessage id={'BUTTON.CONFIRM'} />
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;
};

export default memo(DeleteAddress);
