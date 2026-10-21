import { FC, memo, useCallback } from 'react';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import { Button, Popover } from 'antd';
import { useNavigate } from 'react-router';

import { useAppSelector } from '../../../../../store/hooks';
import { selectLanguage } from '../../../../../store/slices/settings';
import PAGES from '../../../../../constants/pages';
import { JUST_SWAP_URL_ZH, JUST_SWAP_URL_EN } from '../../../../../constants/api';
import {
  NODE_ID_MAIN,
  NODE_ID_MAIN_DAPP_CHAIN,
  NODE_ID_TEST_DAPP_CHAIN,
} from '../../../../../constants/tron_nodes';
import { FuncCheckAndShowRemindModal } from '../../../../../components/RemindModal';

import styles from '../TokenTransferListPage.m.scss';

import swapPic from '../images/icon-swap-pic.svg';
import dappPic from '../images/icon-dapp-chain.svg';

interface Props {
  tokenId: string;
  type: number;
  enableJustSwap: boolean;
  transferStatus: boolean;
  selectedNode: string;

  navigateToTransfer: () => void;
  checkAndShowRemindModal: FuncCheckAndShowRemindModal;
  setShowDAppChainModal: (isShow: boolean) => void;
}

const ButtonGroup: FC<Props> = ({
  tokenId,
  type,
  enableJustSwap,
  transferStatus,
  selectedNode,
  navigateToTransfer,
  checkAndShowRemindModal,
  setShowDAppChainModal,
}) => {
  const navigate = useNavigate();
  const language = useAppSelector(selectLanguage);

  // TRX, Trx10 support dapp chain in TronGrid, DAppChain mainnet and testnet
  const enableDAppChain =
    (type === 0 || type === 1) &&
    [NODE_ID_MAIN, NODE_ID_MAIN_DAPP_CHAIN, NODE_ID_TEST_DAPP_CHAIN].includes(selectedNode);
  const isTronGrid = selectedNode === NODE_ID_MAIN;

  const onClickTronGrid = useCallback(() => {
    setShowDAppChainModal(true);
  }, []);

  return (
    <div className={styles.buttonGroupWrap} id="btnPopup">
      <div className={styles.buttonGroup}>
        <Button
          disabled={!transferStatus}
          onClick={async () => {
            const res = await checkAndShowRemindModal(1);
            if (res) {
              return;
            }

            navigateToTransfer();
          }}
        >
          <i className={styles.send}></i>
          <FormattedMessage
            id={type === 5 ? 'ACCOUNT.TYPE.SEND_COLLECTION' : 'ACCOUNT.TYPE.SEND'}
          />
        </Button>
        <div className={styles.line}></div>
        <Button
          onClick={async () => {
            const res = await checkAndShowRemindModal(1);
            if (res) {
              return;
            }
            navigate(PAGES.PAGE_RECEIVE);
          }}
        >
          <i className={styles.receive}></i>
          <FormattedMessage id={type === 5 ? 'ACCOUNT.RECEIVE' : 'ACCOUNT.TYPE.RECEIVE'} />
        </Button>

        {enableJustSwap || enableDAppChain ? (
          <>
            <div className={styles.line}></div>

            <Popover
              placement="topRight"
              getPopupContainer={() => document.querySelector('#btnPopup') || document.body}
              content={
                <div className={styles.btnPopup}>
                  {enableJustSwap ? (
                    <div
                      className={styles.popupItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        let url = language === 'zh' ? JUST_SWAP_URL_ZH : JUST_SWAP_URL_EN;
                        if (tokenId && tokenId !== '') {
                          url += `?tokenAddress=${tokenId}&type=swap`;
                        }
                        window.open(url);
                      }}
                    >
                      <img src={swapPic} alt="" />
                      <div className={styles.info}>
                        <p className={styles.title}>
                          <FormattedMessage id={'ACCOUNT.MORE.JUSTSWAP'} />
                        </p>
                        <p className={styles.desc}>
                          <FormattedMessage id={'ACCOUNT.MORE.JUSTSWAP.TIPS'} />
                        </p>
                      </div>
                      <i></i>
                    </div>
                  ) : (
                    ''
                  )}

                  {enableDAppChain ? (
                    <div className={styles.popupItem} onClick={onClickTronGrid}>
                      <img src={dappPic} alt="" />
                      <div className={styles.info}>
                        <p className={styles.title}>{isTronGrid ? 'DAppChain' : 'MainChain'}</p>
                        <p className={styles.desc}>
                          <FormattedMessage
                            id={isTronGrid ? 'ACCOUNT.TRANSFER.HOVER' : 'ACCOUNT.TRANSFER.HOVER2'}
                          />
                        </p>
                      </div>
                      <i></i>
                    </div>
                  ) : (
                    ''
                  )}
                </div>
              }
            >
              <Button>
                <i className={styles.more}></i>
                <FormattedMessage id="ACCOUNT.MORE" />
              </Button>
            </Popover>
          </>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default memo(ButtonGroup);
