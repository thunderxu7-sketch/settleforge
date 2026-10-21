import RecentDAppList from './components/RecentDAppList';
import RecommendDAppList from './components/RecommendDAppList';
import NavBar from '../../../components/NavBar/NavBar';

import { useDAppListBiz } from './hook';

import styles from './DAppListPage.m.scss';

const DAppListPage = () => {
  const { dappList } = useDAppListBiz();

  const { recommend, used } = dappList;

  return (
    <div className={styles.dapps}>
      <NavBar title="ACCOUNT.MORE" />

      <div className={styles.content}>
        <RecentDAppList used={used} />

        <RecommendDAppList recommend={recommend} />
      </div>
    </div>
  );
};

export default DAppListPage;
