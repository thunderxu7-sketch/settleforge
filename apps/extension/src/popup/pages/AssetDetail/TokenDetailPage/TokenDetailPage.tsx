import { useLocation } from 'react-router';
import classNames from 'classnames';

import { useSelectedNodeInfo } from '../../../../hooks/selected_node_info';
import NavBar from '../../../../components/NavBar/NavBar';
import TronscanFooter from '../../../../components/TronscanFooter';
import TokenPrice from './components/TokenPrice';
import TokenInfo from './components/TokenInfo';
import PublishInfo from './components/PublishInfo';

import styles from './TokenDetailPage.m.scss';

const TokenDetailPage = () => {
  const location = useLocation();
  const { selectedToken } = (location.state as any) ?? {};
  const {
    name,
    shortName,
    type,
    logoUrl,
    price,
    tokenStatus,
    id,
    contractAddress,
    homePage,
    issueAddress,
    tokenDesc,
    precision,
    totalSupply,
    issueTime,
    transferCount,
    nrOfTokenHolders,
  } = selectedToken;

  const { selectedNodeInfo } = useSelectedNodeInfo();
  const host = selectedNodeInfo?.hostname;
  const path =
    type === 2 || type === 5 ? (tokenStatus === 1 ? '/contract/' : '/token20/') : '/token/';
  const tokenId = type === 1 ? id : contractAddress;
  const tronscanUrl = `${host}${path}${tokenId}`;

  return (
    <div className={classNames(styles.transferDetail, 'scroll', 'col')}>
      <NavBar title="TRANSACTION.TOKEN_INFO.DETAIL" />

      <div className={styles.content}>
        <TokenPrice
          name={name}
          shortName={shortName}
          type={type}
          logoUrl={logoUrl}
          price={price}
          tokenStatus={tokenStatus}
        />

        <TokenInfo
          name={name}
          id={id}
          type={type}
          contractAddress={contractAddress}
          homePage={homePage}
          issueAddress={issueAddress}
          tokenDesc={tokenDesc}
          precision={precision}
        />

        <PublishInfo
          totalSupply={totalSupply}
          type={type}
          issueTime={issueTime}
          transferCount={transferCount}
          nrOfTokenHolders={nrOfTokenHolders}
        />
      </div>

      <TronscanFooter tronscanUrl={tronscanUrl} />
    </div>
  );
};

export default TokenDetailPage;
