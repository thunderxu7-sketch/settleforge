import { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { useCustomSortPageBiz } from './hook';
import NavBar from '../../../components/NavBar/NavBar';
import Drop from './Drop';
import AssetItem from './AssetItem';

import styles from './CustomSortPage.m.scss';

const CustomSortPage = () => {
  const { state, changeTab, confirmSort, goBack, setAssetData, deleteToken } =
    useCustomSortPageBiz();
  const { tabIndex, homeAsset, homeCollection } = state;
  const sourceData = tabIndex === 0 ? homeAsset : homeCollection;
  const topData: any[] = [];
  const assetData: any[] = [];
  sourceData.map((item) => {
    if (Number(item.type) == 0 || Number(item.top) === 2) {
      topData.push(item);
    } else {
      assetData.push(item);
    }
  });

  const treeData = assetData.map((item: any) => {
    const { type, id, contractAddress } = item;
    const temp: { title: ReactNode; key: string } = { title: <></>, key: contractAddress };
    const typeNum = Number(type);
    if (typeNum === 0) {
      temp.key = '0';
    } else if (typeNum === 1) {
      temp.key = id;
    }
    temp.title = <AssetItem token={item} key={temp.key} deleteToken={deleteToken}></AssetItem>;
    return { ...item, ...temp };
  });

  return (
    <div className={classNames(styles.container, 'col')}>
      <NavBar
        onClickLeft={goBack}
        title="ASSET.HOME_ASSET_MANAGE"
        rightElement={
          <div className={styles.rightElement} onClick={() => confirmSort()}>
            <FormattedMessage id="BUTTON.FINISH" />
          </div>
        }
      />
      <div className={styles.sortContent}>
        <div className={styles.tabMenu}>
          <div className={styles.tabNav}>
            <div
              className={classNames({ [styles.active]: tabIndex === 0 })}
              onClick={async () => {
                changeTab(0);
              }}
            >
              <FormattedMessage id="ASSET.ASSET" />
            </div>
            <div
              className={classNames({ [styles.active]: tabIndex === 1 })}
              onClick={() => {
                changeTab(1);
              }}
            >
              <FormattedMessage id="ASSET.COLLECTION" />
            </div>
          </div>
        </div>
        <div className={classNames(styles.content, 'scroll')}>
          {topData?.length > 0 &&
            topData.map((item, index) => (
              <AssetItem token={item} key={index} deleteToken={deleteToken}></AssetItem>
            ))}
          <Drop
            deleteToken={deleteToken}
            treeData={treeData}
            setAssetData={setAssetData}
            tabIndex={tabIndex}
            trxData={topData}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomSortPage;
