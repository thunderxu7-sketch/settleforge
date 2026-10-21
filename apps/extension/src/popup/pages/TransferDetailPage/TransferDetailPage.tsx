import classNames from 'classnames';

import { useTransferDetailBiz } from './hook';
import { useSelectedNodeInfo } from '../../../hooks/selected_node_info';

import NavBar from '../../../components/NavBar/NavBar';
import TronscanFooter from '../../../components/TronscanFooter';
import TransferOverView from './components/TransferOverView';
import TransferInfo from './components/TransferInfo';

import styles from './TransferDetailPage.m.scss';

const TransferDetailPage = () => {
  const { txId, selectedToken, selectedAddress, state } = useTransferDetailBiz();
  const { block, timestamp, fee, transferState, remarks, receipt } = state.transactionDetail;

  let { type, shortName, precision } = selectedToken;
  if (type === 0) {
    precision = 6;
  }

  const { selectedNodeInfo } = useSelectedNodeInfo();
  const host = selectedNodeInfo?.hostname;
  const tronscanUrl = `${host}/transaction/${txId}`;

  return (
    <div className={classNames(styles.transferDetail, 'scroll', 'col')}>
      <NavBar title="TRANSACTION_DETAIL" />

      <div className={styles.content}>
        <TransferOverView
          transferState={transferState}
          precision={precision}
          type={type}
          selectedAddress={selectedAddress}
          remarks={remarks}
          shortName={shortName}
          tronLinkTransactionDetail={state.tronLinkTransactionDetail}
        />

        <TransferInfo
          transferState={transferState}
          type={type}
          txId={txId}
          timestamp={timestamp}
          block={block}
          fee={fee}
          receipt={receipt}
          chainParameters={state.chainParameters}
          tronLinkTransactionDetail={state.tronLinkTransactionDetail}
        />
      </div>

      <TronscanFooter tronscanUrl={tronscanUrl} />
    </div>
  );
};

export default TransferDetailPage;
