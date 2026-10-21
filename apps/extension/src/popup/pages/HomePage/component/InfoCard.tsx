import { FC, memo, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Progress, Tooltip } from 'antd';
import classNames from 'classnames';

import { bigFormat, BigNumber, formatNumber } from '../../../utils/numberUtils';
import { cutMiddle } from '../../../utils';
import { setGaEvent } from '../../../utils/gaUtils';
import Toast from '../../../../components/Toast';
import { AddressItemCompType } from '../hook';
import { ACCOUNT_TYPE } from '../constants';
import ResizableBalance from './ResizableBalance';

import { usePricesInfo } from '../../../../hooks/prices_info';
import { useSelectedAddressItem } from '../../../../hooks/selected_address_item';
import type { FuncCheckAndShowRemindModal } from '../../../../components/RemindModal/hook';

import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

import TopBar from './TopBar';
import MenuList from './MenuList';

import styles from '../HomePage.m.scss';

import iconCopy from '../images/copy.svg';

interface Props {
  nodeIds: Array<any>;
  nodeList: Record<string, any>;
  selectedNode: string;
  onClickNode: (nodeId: string) => void;
  setWalletListVisible: (visible: boolean) => void;
  selectedAccount: AddressItemCompType;
  showConnectedWebsites: () => void;
  showConnectedAddresses: () => void;
  showNameModal: () => void;
  showDeleteAddress: () => void;
  addressResource: any;
  menuListVisible: boolean;
  setMenuListVisible: (visible: boolean) => void;
  selectVisible: boolean;
  setSelectVisible: (visible: boolean) => void;
  balanceVisible: boolean;
  toggleBalanceVisible: () => void;
  refreshHomePage: () => void;
  checkAndShowRemindModal: FuncCheckAndShowRemindModal;
}

const getAccountTypeText = (type: number) => {
  if (type === ACCOUNT_TYPE.MNEMONIC) return '';
  if (type === ACCOUNT_TYPE.LEDGER) return 'Ledger';
  return 'Non-HD';
};

const InfoCard: FC<Props> = ({
  nodeIds,
  nodeList,
  selectedNode,
  onClickNode,
  setWalletListVisible,
  selectedAccount,
  showConnectedWebsites,
  showNameModal,
  showDeleteAddress,
  addressResource,
  menuListVisible,
  setMenuListVisible,
  selectVisible,
  setSelectVisible,
  balanceVisible,
  toggleBalanceVisible,
  refreshHomePage,
  showConnectedAddresses,
  checkAndShowRemindModal,
}) => {
  const { formatMessage } = useIntl();

  const { pricesInfo } = usePricesInfo();
  const { selectedAddressItem } = useSelectedAddressItem();
  const userAddress = selectedAddressItem?.address;
  const userName = selectedAddressItem?.name;
  const currentAssetValue = selectedAccount?.totalAsset;

  const accountType = selectedAccount?.accountType;

  const accountTypeText = getAccountTypeText(accountType);

  const { netLimit, netUsed, energy, energyUsed } = addressResource;

  const bandWidth =
    new BigNumber(netLimit).gte(0) && new BigNumber(netUsed).gte(0)
      ? new BigNumber(netLimit).minus(netUsed).gt(0)
        ? new BigNumber(netLimit).minus(netUsed).toFixed(0)
        : 0
      : '--';
  const maxBandWidth = netLimit ?? '--';
  const bandWidthPer = new BigNumber(bandWidth).div(maxBandWidth).times(100).toFixed(2);

  const energyRemaining =
    new BigNumber(energy).gte(0) && new BigNumber(energyUsed).gte(0)
      ? new BigNumber(energy).minus(energyUsed).gt(0)
        ? new BigNumber(energy).minus(energyUsed).toFixed(0)
        : 0
      : '--';
  const maxEnergy = new BigNumber(energy).gt(0) ? new BigNumber(energy).toFixed(0) : 0;
  const energyPer = new BigNumber(energyRemaining).div(maxEnergy).times(100).toFixed(2);

  const [scanTipVisible] = useState(false);

  const openTronscanAccountFromTronLink = () => {
    const accountUrl = nodeList[selectedNode]?.accountUrl;
    accountUrl && window.open(accountUrl);
  };

  const balanceStr = balanceVisible
    ? `${pricesInfo.symbol} ${formatNumber(currentAssetValue, {
        dp: 3,
        cutZero: true,
      })}`
    : '*************';

  const onCopy = useCallback(
    async (e: any) => {
      e.stopPropagation();
      const res = await checkAndShowRemindModal(1);
      if (res) {
        return;
      }

      Toast.show({
        icon: 'success',
        content: formatMessage({ id: 'TOAST.COPY' }),
        duration: 2000,
      });
      await window.navigator.clipboard.writeText(userAddress);

      setGaEvent('Home', 'Click Copy', 'Click Copy');
    },
    [checkAndShowRemindModal],
  );

  return (
    <div
      className={classNames(
        styles.card,
        {
          [styles.hotBg]: accountType === 0 || accountType === 1,
          [styles.ledgerBg]: accountType === 2,
        },
        'paddingLR16',
      )}
    >
      <TopBar
        selectedNode={selectedNode}
        nodeList={nodeList}
        selectVisible={selectVisible}
        nodeIds={nodeIds}
        menuListVisible={menuListVisible}
        userName={userName}
        onClickNode={onClickNode}
        setMenuListVisible={setMenuListVisible}
        setSelectVisible={setSelectVisible}
        setWalletListVisible={setWalletListVisible}
        refreshHomePage={refreshHomePage}
        showConnectedAddresses={showConnectedAddresses}
      />

      <div className={styles.cardBox}>
        <div className={styles.info}>
          <div className={classNames(styles.addressWrap, styles.flLeft, styles.flAcent)}>
            <div className={styles.userAddress}>{cutMiddle(userAddress)}</div>
            <Tooltip
              title={<FormattedMessage id="TOOLTIP.COPY" />}
              overlayInnerStyle={toolTipsOverlayInnerStyle}
              overlayStyle={{
                paddingBottom: '2px',
              }}
            >
              <img src={iconCopy} alt="" className={styles.copy} onClick={onCopy} />
            </Tooltip>
            <Tooltip
              placement="top"
              title={<FormattedMessage id="HOME.VIEWIN_TRANSCAN" />}
              overlayInnerStyle={toolTipsOverlayInnerStyle}
              overlayStyle={{
                paddingBottom: '2px',
              }}
            >
              <div
                className={styles.tronscan}
                onClick={(e) => {
                  e.stopPropagation();
                  openTronscanAccountFromTronLink();
                }}
              ></div>
            </Tooltip>
            {accountType !== ACCOUNT_TYPE.MNEMONIC && accountType !== ACCOUNT_TYPE.LEDGER && (
              <div className={styles.accountTypeText}>
                <span>{accountTypeText}</span>
              </div>
            )}
            <div
              className={classNames(styles.view, balanceVisible ? styles.canView : styles.cantView)}
              onClick={toggleBalanceVisible}
            ></div>
            {scanTipVisible && (
              <span className={styles.toScanTip}>
                <FormattedMessage id="HOME.VIEWIN_TRANSCAN" />
              </span>
            )}
          </div>
          <ResizableBalance balanceStr={balanceStr} />

          <div className={styles.cardBottom}>
            <div className={styles.energy}>
              <Progress
                percent={Number(energyPer)}
                strokeColor="#fff"
                trailColor="rgba(255, 255, 255, 0.2)"
                size="small"
                type="line"
                showInfo={false}
                strokeWidth={2}
              />
              <div className={classNames(styles.flSp, styles.mbMinus)}>
                <div className={styles.whiteText}>
                  <FormattedMessage id="TRANSACTIONS.ENERGY" />
                </div>
                <div>
                  <span className={classNames(styles.whiteText, styles.bold)}>
                    {bigFormat(energyRemaining)}
                  </span>
                  <span className={styles.grayText}>{`/${bigFormat(maxEnergy)}`}</span>
                </div>
              </div>
            </div>
            <div className={styles.bandWidth}>
              <Progress
                percent={Number(bandWidthPer)}
                strokeColor="#fff"
                trailColor="rgba(255, 255, 255, 0.2)"
                size="small"
                type="line"
                showInfo={false}
                strokeWidth={2}
              />
              <div className={classNames(styles.flSp, styles.mbMinus)}>
                <div className={styles.whiteText}>
                  <FormattedMessage id="TRANSACTIONS.BANDWIDTH" />
                </div>
                <div>
                  <span className={styles.whiteText}>{bigFormat(bandWidth)}</span>
                  <span className={styles.grayText}>{`/${bigFormat(maxBandWidth)}`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {menuListVisible && (
        <MenuList
          nodeList={nodeList}
          selectedNode={selectedNode}
          accountType={accountType}
          userAddress={userAddress}
          setMenuListVisible={setMenuListVisible}
          showNameModal={showNameModal}
          showDeleteAddress={showDeleteAddress}
          showConnectedWebsites={showConnectedWebsites}
        />
      )}
    </div>
  );
};
export default memo(InfoCard);
