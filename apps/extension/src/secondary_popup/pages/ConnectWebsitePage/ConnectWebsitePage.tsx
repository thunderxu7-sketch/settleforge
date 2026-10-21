import { useConnectWebsiteBiz } from './hook';
import WebsiteInfo from './components/WebsiteInfo';
import AddressInfo from './components/AddressInfo';
import Buttons from './components/Buttons';

import styles from './ConnectWebsitePage.m.scss';

const ConnectWebsitePage = () => {
  const { state, onConfirm, onCancel } = useConnectWebsiteBiz();
  return (
    <div className={styles.page}>
      <WebsiteInfo hostname={state.hostname} websiteIcon={state.websiteIcon} />

      <AddressInfo name={state.name} amount={state.amount} address={state.address} />

      <Buttons onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  );
};

export default ConnectWebsitePage;
