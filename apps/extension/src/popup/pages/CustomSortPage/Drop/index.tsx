import { FC } from 'react';
import { Tree } from 'antd';

interface Props {
  setAssetData: any;
  tabIndex: number;
  treeData: any;
  trxData: any;
  deleteToken: (token: any) => void;
}

const DropComponent: FC<Props> = ({ setAssetData, tabIndex, treeData, trxData }) => {
  const onDrop = (info) => {
    if (info.dragNode.type == 0) return;
    const dropKey = info.node.props.eventKey;
    const dragKey = info.dragNode.props.eventKey;
    const dropPos = info.node.props.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
    const loop = (data, key, callback) => {
      data.forEach((item, index, arr) => {
        if (item.key === key) {
          return callback(item, index, arr);
        }
        if (item.children) {
          return loop(item.children, key, callback);
        }
      });
    };
    const data = [...treeData];
    let dragObj;
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });
    if (info.dropToGap) {
      let ar;
      let i;
      loop(data, dropKey, (item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    } else {
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        item.children.push(dragObj);
      });
    }
    let dataFilter = data.map((item) => {
      const newItem = { ...item };
      delete newItem.title;
      delete newItem.key;
      return newItem;
    });

    if (trxData?.length > 0) {
      dataFilter = trxData.concat(dataFilter);
    }

    setAssetData(dataFilter, tabIndex);
  };

  return <Tree draggable onDrop={onDrop} treeData={treeData}></Tree>;
};

export default DropComponent;
