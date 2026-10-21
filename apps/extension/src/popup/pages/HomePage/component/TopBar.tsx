import { FC, memo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Tooltip } from 'antd';
import classNames from 'classnames';

import { useConnectedInfo } from '../../../../hooks/conncted_info';
import { DEFAULT_MAIN_NODE_IDS } from '../../../../constants/tron_nodes';
import { setGaEvent } from '../../../utils/gaUtils';

import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

import styles from '../HomePage.m.scss';

interface Props {
  selectedNode: string;
  nodeList: Record<string, any>;
  selectVisible: boolean;
  nodeIds: Array<any>;
  menuListVisible: boolean;
  userName: string;
  onClickNode: (nodeId: string) => void;
  setMenuListVisible: (visible: boolean) => void;
  setSelectVisible: (visible: boolean) => void;
  setWalletListVisible: (visible: boolean) => void;
  refreshHomePage: () => void;
  showConnectedAddresses: () => void;
}

const TopBar: FC<Props> = ({
  selectedNode,
  nodeList,
  selectVisible,
  nodeIds,
  menuListVisible,
  userName,
  onClickNode,
  setMenuListVisible,
  setSelectVisible,
  setWalletListVisible,
  refreshHomePage,
  showConnectedAddresses,
}) => {
  const [nodeOptionActive, setNodeOptionActive] = useState(selectedNode);

  const { isConnected } = useConnectedInfo();

  const onSelect = (nodeId: string) => {
    setNodeOptionActive(nodeId);
    onClickNode(nodeId);
    setSelectVisible(false);
  };

  const walletListClick = () => {
    setWalletListVisible(true);
    setGaEvent('Home', 'Click Add Wallet', 'Click Add Wallet');
  };

  return (
    <div className={styles.topBarContainer}>
      <div className={styles.userName} onClick={walletListClick}>
        <Tooltip
          placement="bottom"
          title={<FormattedMessage id="HOME.SWITCH_WALLET" />}
          overlayInnerStyle={toolTipsOverlayInnerStyle}
          overlayStyle={{
            paddingTop: '4px',
          }}
        >
          <span className={styles.userNameText}>{userName}</span>
          <i className={styles.userNameToggle}></i>
        </Tooltip>
      </div>
      <div className={styles.networkWrap}>
        <div className={styles.networkName}>
          <span
            className={classNames(styles.activeOption, selectVisible ? styles.selectUp : '')}
            onClick={() => setSelectVisible(!selectVisible)}
          >
            {nodeList[nodeOptionActive]?.formatName ? (
              <FormattedMessage id={nodeList[nodeOptionActive].formatName} />
            ) : (
              nodeList[nodeOptionActive].name
            )}
          </span>
        </div>
        <div
          className={classNames(selectVisible ? styles.selectShow : styles.selectHide, 'scroll')}
        >
          {nodeIds.map((nodeId: string) => {
            const { name, formatName, fullNode } = nodeList[nodeId];
            return (
              fullNode && (
                <div
                  className={classNames(
                    styles.networkItem,
                    nodeOptionActive === nodeId ? styles.netActive : '',
                  )}
                  key={nodeId}
                  onClick={() => onSelect(nodeId)}
                >
                  <div
                    className={classNames(
                      styles.netMarker,
                      DEFAULT_MAIN_NODE_IDS.includes(nodeId) ? '' : styles.notMain,
                    )}
                  ></div>
                  <div className={styles.netName}>
                    {formatName ? <FormattedMessage id={formatName} /> : name}
                  </div>
                </div>
              )
            );
          })}
        </div>
      </div>

      <div className={styles.operationWrap}>
        <Tooltip
          placement="bottom"
          title={
            <FormattedMessage
              id={
                isConnected
                  ? 'ACCOUNT.AUTH_WEBSITE.ADDRESS.CONNECTED'
                  : 'ACCOUNT.AUTH_WEBSITE.ADDRESS.UNCONNECTED'
              }
            />
          }
          overlayInnerStyle={toolTipsOverlayInnerStyle}
          overlayStyle={{
            paddingTop: '4px',
          }}
        >
          <div
            className={classNames(
              styles.connectIcon,
              isConnected ? styles.connected : styles.unconnected,
            )}
            onClick={showConnectedAddresses}
          ></div>
        </Tooltip>
        <div className={styles.refreshIcon} onClick={refreshHomePage}></div>
        <Tooltip
          placement="bottom"
          title={<FormattedMessage id="HOME.WALLET_MANAGE" />}
          overlayInnerStyle={toolTipsOverlayInnerStyle}
          overlayStyle={{
            paddingTop: '2px',
          }}
        >
          <div
            className={classNames(styles.menuIcon, menuListVisible && styles.blue)}
            onClick={() => {
              setGaEvent('Home', 'Click Account Management', 'Click Account Management');
              setMenuListVisible(!menuListVisible);
            }}
          ></div>
        </Tooltip>
      </div>
    </div>
  );
};

export default memo(TopBar);
