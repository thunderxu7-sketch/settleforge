import _ from 'lodash';

import { useAppSelector } from '../store/hooks';

import { getSelectedNode, getNodeList } from './../store/slices/node_management';

export const useSelectedNodeInfo = () => {
  const selectedNode = useAppSelector(getSelectedNode);
  const nodeList = useAppSelector(getNodeList);

  const selectedNodeInfo = nodeList[selectedNode];

  return {
    selectedNode,
    nodeList,
    selectedNodeInfo,
  };
};
