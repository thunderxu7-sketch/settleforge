import { FC, memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import { Drawer, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';

import { formatNumber } from '../../../utils/numberUtils';
import WalletCard from './WalletCard';
import WalletSearch from './WalletSearch';
import { WalletInfoType } from '../hook';
import PAGES from '../../../../constants/pages';
import { usePricesInfo } from '../../../../hooks/prices_info';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';
import ResizableText from '../../../../components/ResizableText';
import type { FuncCheckAndShowRemindModal } from '../../../../components/RemindModal';

import styles from '../HomePage.m.scss';

interface Props {
  walletInfo: WalletInfoType;
  walletListVisible: boolean;
  walletSearchVisible: boolean;
  setWalletListVisible: (visible: boolean) => void;
  setWalletSearchVisible: (visible: boolean) => void;
  selectedCurrency: string;
  onClickWalletCard: (address: string) => void;
  onChangeWalletSearch: (address: string) => void;
  walletSearchResult: any;
  walletSearchValue: string;
  checkAndShowRemindModal: FuncCheckAndShowRemindModal;
}

const WalletList: FC<Props> = ({
  walletInfo,
  walletListVisible,
  walletSearchVisible,
  setWalletListVisible,
  selectedCurrency,
  onClickWalletCard,
  onChangeWalletSearch,
  setWalletSearchVisible,
  walletSearchResult,
  walletSearchValue,
  checkAndShowRemindModal,
}) => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { pricesInfo } = usePricesInfo();

  const [fiatSwitch, setFiatSwitch] = useState(true);
  const [currentTag, setCurrentTag] = useState('');

  const {
    recentAccounts = [],
    hotAccounts = [],
    ledgerAccounts = [],
    totalTrx,
    totalAsset,
  } = walletInfo;
  const recentVisible = _.size(recentAccounts) > 0;
  const hotVisible = _.size(hotAccounts) > 0;
  const ledgerVisible = _.size(ledgerAccounts) > 0;
  const unitText = fiatSwitch ? selectedCurrency : 'TRX';
  const changeFiatAsset = () => {
    setFiatSwitch(!fiatSwitch);
  };

  useEffect(() => {
    const removeListener = handleScroll();
    return removeListener;
  }, []);

  const gotoAddWallet = useCallback(() => {
    navigate(PAGES.PAGE_ADD_WALLET);
  }, [navigate]);

  const scrollToAnchor = useCallback((anchorName: string) => {
    if (anchorName) {
      const anchorElement = document.getElementById(anchorName);
      if (anchorElement) {
        anchorElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
        setCurrentTag(anchorName);
      }
    }
  }, []);

  const handleScroll = useCallback(() => {
    const bufferDistance = 100;

    const list = document.getElementById('allList');
    const recentWallet = document.getElementById('recentWallet');
    const hotWallet = document.getElementById('hotWallet');
    const ledgerWallet = document.getElementById('ledgerWallet');

    const scrollListener = _.debounce(() => {
      const listDistance = list?.getBoundingClientRect()?.top || 0;
      const recentWalletDistance = recentWallet?.getBoundingClientRect()?.top || 0;
      const hotWalletDistance = hotWallet?.getBoundingClientRect()?.top || 0;
      const ledgerWalletDistance = ledgerWallet?.getBoundingClientRect()?.top || 0;

      if (listDistance > ledgerWalletDistance - bufferDistance) {
        setCurrentTag('ledgerWallet');
      } else if (listDistance > hotWalletDistance - bufferDistance) {
        setCurrentTag('hotWallet');
      } else if (listDistance > recentWalletDistance - bufferDistance) {
        setCurrentTag('recentWallet');
      }
    }, 500);

    list?.addEventListener('scroll', scrollListener);

    return () => {
      list?.removeEventListener('scroll', scrollListener);
    };
  }, []);

  const checkSearchStatus = (e: any) => {
    const { className, type } = e.target;
    if (
      walletSearchVisible &&
      type !== 'text' &&
      className?.indexOf('switch') < 0 &&
      className?.indexOf('clearInput') < 0 &&
      className?.indexOf('inputBox') < 0 &&
      walletSearchValue.length == 0
    )
      setWalletSearchVisible(false);
  };

  return (
    <div className={styles.walletListContainer} onClick={(e) => checkSearchStatus(e)}>
      <Drawer
        title=""
        placement={'left'}
        closable={false}
        visible={walletListVisible}
        key={'left'}
        className={styles.drawerBoard}
        bodyStyle={{ width: '320px', padding: '0' }}
        contentWrapperStyle={{ width: '320px' }}
        drawerStyle={{ padding: '0' }}
        headerStyle={{ display: 'none' }}
        getContainer={false}
      >
        <div className={styles.walletListComponent}>
          <div className={styles.totalAssets}>
            <div className={styles.totalAssetsImg}></div>
            <div>
              <div className={styles.totalAssetsText}>
                <FormattedMessage id="WALLET.TOTAL_ASSETS" />
                <Tooltip
                  title={formatMessage({ id: 'WALLET.TOTAL_ASSETS_TIP' })}
                  overlayInnerStyle={{
                    ...toolTipsOverlayInnerStyle,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <div className={styles.toolTipIcon}></div>
                </Tooltip>
              </div>
              <div className={styles.totalAssetsAmount}>
                <ResizableText
                  initSize={16}
                  text={`${pricesInfo.symbol} ${formatNumber(fiatSwitch ? totalAsset : totalTrx, {
                    dp: 3,
                    cutZero: true,
                  })}
              `}
                />

                {/* <div className={styles.flAcent}>
                <div className={styles.trx}>{unitText}</div>
                <div className={styles.switch} onClick={changeFiatAsset}></div>
              </div> */}
              </div>
            </div>
          </div>

          {walletSearchVisible ? (
            <WalletSearch
              onChangeWalletSearch={onChangeWalletSearch}
              walletSearchResult={walletSearchResult}
              onClickWalletCard={onClickWalletCard}
              walletSearchValue={walletSearchValue}
              setWalletSearchVisible={setWalletSearchVisible}
              checkAndShowRemindModal={checkAndShowRemindModal}
            />
          ) : (
            <div className={styles.drawerContainer}>
              <div className={styles.menu}>
                <Tooltip
                  title={<FormattedMessage id="ASSET.SEARCH.WALLET" />}
                  placement="right"
                  overlayInnerStyle={toolTipsOverlayInnerStyle}
                >
                  <div
                    className={classNames(styles.menuLi, styles.search)}
                    onClick={() => setWalletSearchVisible(true)}
                  ></div>
                </Tooltip>
                {recentVisible && (
                  <Tooltip
                    title={<FormattedMessage id="ASSET.RECENT.WALLET" />}
                    placement="right"
                    overlayInnerStyle={toolTipsOverlayInnerStyle}
                  >
                    <div
                      className={classNames(
                        styles.menuLi,
                        styles.recent,
                        currentTag === 'recentWallet' && styles.current,
                      )}
                      onClick={() => scrollToAnchor('recentWallet')}
                    ></div>
                  </Tooltip>
                )}
                {hotVisible && (
                  <Tooltip
                    title={<FormattedMessage id="ASSET.HOT.WALLET" />}
                    placement="right"
                    overlayInnerStyle={toolTipsOverlayInnerStyle}
                  >
                    <div
                      className={classNames(
                        styles.menuLi,
                        styles.hotWallet,
                        currentTag === 'hotWallet' && styles.current,
                      )}
                      onClick={() => scrollToAnchor('hotWallet')}
                    ></div>
                  </Tooltip>
                )}
                {ledgerVisible && (
                  <Tooltip
                    title={<FormattedMessage id="ASSET.LEDGER.WALLET" />}
                    placement="right"
                    overlayInnerStyle={toolTipsOverlayInnerStyle}
                  >
                    <div
                      className={classNames(
                        styles.menuLi,
                        styles.ledger,
                        currentTag === 'ledgerWallet' && styles.current,
                      )}
                      onClick={() => scrollToAnchor('ledgerWallet')}
                    ></div>
                  </Tooltip>
                )}
              </div>
              <div className={styles.walletListContent}>
                <div className={classNames(styles.allList, 'scroll')} id="allList">
                  <div id="recentWallet">
                    {recentVisible && (
                      <WalletCard
                        data={recentAccounts}
                        type={'recent'}
                        title={formatMessage({ id: 'WALLET.SWITCH.USE_RECENTLY' })}
                        onClickWalletCard={onClickWalletCard}
                        checkAndShowRemindModal={checkAndShowRemindModal}
                      />
                    )}
                  </div>
                  <div id="hotWallet">
                    {_.size(hotAccounts) > 0 && (
                      <WalletCard
                        type={'hot'}
                        data={hotAccounts}
                        title={formatMessage({ id: 'WALLET.SWITCH.HOT_WALLET' })}
                        onClickWalletCard={onClickWalletCard}
                        checkAndShowRemindModal={checkAndShowRemindModal}
                      />
                    )}
                  </div>
                  <div id="ledgerWallet">
                    {_.size(ledgerAccounts) > 0 && (
                      <WalletCard
                        type={'ledger'}
                        data={ledgerAccounts}
                        title={'Ledger'}
                        onClickWalletCard={onClickWalletCard}
                        checkAndShowRemindModal={checkAndShowRemindModal}
                      />
                    )}
                  </div>
                </div>

                <div className={styles.footerWrap}>
                  <div onClick={gotoAddWallet} className={styles.footer}>
                    <div className={styles.createWallet}>
                      <FormattedMessage id="HOME.MENU.ADD_WALLET_BUTTON" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Drawer>
      {walletListVisible && (
        <div className={styles.close} onClick={() => setWalletListVisible(false)}></div>
      )}
    </div>
  );
};

export default memo(WalletList);
