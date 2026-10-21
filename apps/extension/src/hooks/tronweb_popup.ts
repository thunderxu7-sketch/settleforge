import { useMemo } from 'react';
import log from 'loglevel';
// @ts-ignore
import TronWeb from 'tronweb';

import { useSelectedNodeInfo } from './selected_node_info';
import { NODE_ID_MAIN, TRON_NODES } from '../constants/tron_nodes';

export const useTronWebInstance = () => {
  const { selectedNodeInfo } = useSelectedNodeInfo();
  const { fullNode, solidityNode, eventServer } = selectedNodeInfo;

  const tronWebInstance = useMemo(() => {
    try {
      return new TronWeb(fullNode, solidityNode, eventServer);
    } catch (e: any) {
      log.error(e);
      const { fullNode, solidityNode, eventServer } = TRON_NODES[NODE_ID_MAIN];
      return new TronWeb(fullNode, solidityNode, eventServer);
    }
  }, [fullNode, solidityNode, eventServer]);

  return {
    tronWebInstance,
  };
};
