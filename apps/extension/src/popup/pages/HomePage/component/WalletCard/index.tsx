import { FC, memo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Tooltip } from 'antd';
import classNames from 'classnames';

import { changeKeyRed, cutMiddle, highlight } from '../../../../utils';
import { usePricesInfo } from '../../../../../hooks/prices_info';
import { formatNumber } from '../../../../utils/numberUtils';
import { ACCOUNT_TYPE } from '../../constants';
import { setGaEvent } from '../../../../utils/gaUtils';
import { safeEscape } from '../../../../utils/escape';
import { toolTipsOverlayInnerStyle } from '../../../../../constants/style_object';
import type { FuncCheckAndShowRemindModal } from '../../../../../components/RemindModal';
import Toast from '../../../../../components/Toast';

import ResizableText from '../../../../../components/ResizableText';

import styles from './WalletCard.m.scss';

interface Props {
  data: any;
  type: any;
  title: string;
  onClickWalletCard: (address: string) => void;
  walletSearchValue?: string;
  checkAndShowRemindModal: FuncCheckAndShowRemindModal;
}
const WalletCard: FC<Props> = ({
  data,
  type,
  title,
  onClickWalletCard,
  walletSearchValue = '',
  checkAndShowRemindModal,
}) => {
  const { formatMessage } = useIntl();

  const { pricesInfo } = usePricesInfo();

  const onCopy = useCallback(
    async (e: any, item: any) => {
      e.stopPropagation();
      const res = await checkAndShowRemindModal(2, item.address);
      if (res) {
        return;
      }

      Toast.show({
        icon: 'success',
        content: formatMessage({ id: 'TOAST.COPY' }),
        duration: 2000,
      });
      await window.navigator.clipboard.writeText(item.address);
      setGaEvent('Change Wallet', 'Click Copy', 'Click Copy');
    },
    [checkAndShowRemindModal],
  );

  return (
    <div className={styles.walletCardList}>
      <div className={styles.title}>{title}</div>
      <div className={styles.listWrapper}>
        {data?.map((item: any, index: number) => {
          let addressHtml = cutMiddle(item.address);
          if (type === 'result' && walletSearchValue?.length >= 2) {
            const res = changeKeyRed([item.address], walletSearchValue, { cutIndex: 0 });
            if (res?.found) {
              addressHtml = res?.dom || '';
            }
          }

          return (
            <div
              className={classNames(
                styles.item,
                styles[type],
                item.accountType == 2 ? styles.ledger : styles.hot,
              )}
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onClickWalletCard(item.address);
              }}
            >
              <div className={classNames(styles.header)}>
                <div
                  className={classNames(styles.name, {
                    [styles.recent]: type == 'recent',
                  })}
                  dangerouslySetInnerHTML={{
                    __html:
                      type === 'result'
                        ? highlight(item.name, walletSearchValue)
                        : safeEscape(item.name),
                  }}
                />
                {item.current && <div className={styles.checked}></div>}
              </div>

              <div className={styles.body}>
                {type !== 'recent' && (
                  <>
                    <div className={styles.balance}>
                      <span className={styles.totalTrx}>
                        <ResizableText
                          initSize={16}
                          text={formatNumber(item.totalTrx, {
                            dp: 3,
                            cutZero: true,
                          })}
                        />
                      </span>
                      <span className={styles.trx}>{' TRX'}</span>
                    </div>
                    <div className={styles.balanceUsd}>{`≈ ${pricesInfo.symbol} ${formatNumber(
                      item.totalAsset,
                      {
                        dp: 3,
                        cutZero: true,
                      },
                    )}`}</div>
                  </>
                )}
                <div className={styles.flLeft} onClick={(e) => e.stopPropagation()}>
                  <div
                    className={classNames(
                      styles.address,
                      walletSearchValue === item.address ? styles.red : '',
                    )}
                    dangerouslySetInnerHTML={{
                      __html: addressHtml,
                    }}
                  ></div>
                  <Tooltip
                    overlayInnerStyle={toolTipsOverlayInnerStyle}
                    title={formatMessage({
                      id: 'TOOLTIP.COPY',
                    })}
                  >
                    <div
                      className={styles.copy}
                      onClick={async (e) => {
                        await onCopy(e, item);
                      }}
                    />
                  </Tooltip>
                  {item.accountType !== ACCOUNT_TYPE.MNEMONIC &&
                    item.accountType !== ACCOUNT_TYPE.LEDGER && (
                      <div className={styles.type}>{getAccountTypeText(item.accountType)}</div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getAccountTypeText = (type: number) => {
  if (type === ACCOUNT_TYPE.MNEMONIC) return '';
  if (type === ACCOUNT_TYPE.LEDGER) return 'Ledger';
  return 'Non-HD';
};

export default memo(WalletCard);
