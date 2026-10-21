import { ChangeEvent, FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Input, Tooltip } from 'antd';

import { useSelectedLanguage } from '../../../../hooks/language';
import { DeriveAccountType } from '../hook';

import styles from '../NewHDAddressPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

interface Props {
  name: string;
  originName: string;
  originAddress: string;
  isNameError: boolean;
  remind: boolean;
  deriveAccount: DeriveAccountType;
  mnemonicAccountCount: number;
  onChangeWalletName: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.MouseEvent<HTMLDivElement>) => void;
  toggleConfirmModal: (event: React.MouseEvent<HTMLSpanElement>) => void;
  switchSeed: (event: React.MouseEvent<HTMLDivElement>) => void;
}

interface OtherPathLabelProps {
  onClick: (event: React.MouseEvent<HTMLSpanElement>) => void;
}

const OtherPathLabel: FC<OtherPathLabelProps> = ({ onClick }) => {
  const { formatMessage } = useIntl();
  const { langAbbr } = useSelectedLanguage();

  if (langAbbr == 'ja') {
    return (
      <Tooltip
        placement="bottomRight"
        title={formatMessage({ id: 'HD.USE_OTHER_PATH' })}
        overlayInnerStyle={toolTipsOverlayInnerStyle}
      >
        <span
          onClick={onClick}
          className={classNames(styles.otherPath, { [styles.jp]: langAbbr == 'ja' })}
        >
          <FormattedMessage id="HD.USE_OTHER_PATH" />
        </span>
      </Tooltip>
    );
  }

  return (
    <span onClick={onClick} className={classNames(styles.otherPath)}>
      <FormattedMessage id="HD.USE_OTHER_PATH" />
    </span>
  );
};

const AdvancedOptions: FC<Props> = ({
  name,
  originName,
  isNameError,
  originAddress,
  remind,
  deriveAccount,
  mnemonicAccountCount,
  onChangeWalletName,
  onSubmit,
  toggleConfirmModal,
  switchSeed,
}) => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.content}>
      <div className={styles.walletName}>
        <div className={styles.name}>
          <FormattedMessage id="HD.SET_WALLET_NAME" />
        </div>

        <div className={styles.walletNameInputWrapper}>
          <Input
            value={name}
            allowClear
            placeholder={formatMessage({ id: 'HD.SET_WALLET_NAME' })}
            onChange={onChangeWalletName}
            maxLength={14}
          />

          {isNameError && (
            <div className={styles.nameError}>
              <FormattedMessage id="WALLET.NAME.LENGTH_RULE" />
            </div>
          )}
        </div>
      </div>

      <div className={styles.walletPassword}>
        <p>
          <FormattedMessage id="HD.ACCOUNT_TO_ADDRESS" />
        </p>
        <div className={styles.toAccount}>
          <div className="flex">
            <span className={styles.formatName}>{originName}</span>
            {mnemonicAccountCount < 2 ? (
              <span />
            ) : (
              <span className={styles.changeAccount} onClick={switchSeed}>
                <FormattedMessage id="HD.CHANGE" />
              </span>
            )}
          </div>
          <div>{originAddress}</div>
        </div>
        {remind && (
          <div className={styles.remindStatus}>
            <FormattedMessage id="HD.NEEDBACKUP" />
          </div>
        )}
        {deriveAccount != null && (
          <>
            <p className={classNames(styles.walletPassword, 'flex')}>
              <span>
                <FormattedMessage id="HD.NEW_ADDRESS" />
                (Path: {deriveAccount.path})
              </span>
              {remind ? (
                <span className={classNames(styles.otherPath, styles.otherPathDisabled)}>
                  <FormattedMessage id="HD.USE_OTHER_PATH" />
                </span>
              ) : (
                <OtherPathLabel onClick={toggleConfirmModal} />
              )}
            </p>
            <div className={styles.toAccount}>
              <div>{deriveAccount.address}</div>
            </div>
          </>
        )}
      </div>

      <div
        className={classNames(styles.button, {
          [styles.disabled]: isNameError || remind,
        })}
        onClick={isNameError || remind ? undefined : onSubmit}
      >
        <FormattedMessage id="HD.NEW_ADDRESS_BTN" />
      </div>
    </div>
  );
};

export default memo(AdvancedOptions);
