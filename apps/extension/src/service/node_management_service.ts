import { MessageHub, MessageNode, SimplexMessage } from '../lib/bg_msg';
import type { NodeListItemType } from '../store/slices/node_management';
import { addNode, deleteNode, updateSelectedNode } from '../store/slices/node_management';
import { getStore } from '../store/store';
import { sendNotifyEvent } from '../lib/notify_event';
import { sleep } from '../lib/async_func';
import { requestAccountsManager } from '../domain/request_accounts_manager';
import { EVENT_DELETE_NODE, eventBus } from '../domain/event_bus';

interface Params {
  value: string;
}

interface AddNodeParams {
  value: NodeListItemType;
}

const ACTION_NAME_DELETE_NODE = 'NODE_MANAGEMENT_DELETE_NODE';
const ACTION_NAME_ADD_NODE = 'NODE_MANAGEMENT_ADD_NODE';
const ACTION_NAME_SELECTED_NODE = 'NODE_MANAGEMENT_SELECTED_NODE';

export const callDeleteNodeService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new SimplexMessage(ACTION_NAME_DELETE_NODE, data));
  return res;
};

export const registerDeleteNodeService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACTION_NAME_DELETE_NODE);

  messageHub.on(ACTION_NAME_DELETE_NODE, async (data: Params) => {
    getStore().dispatch(deleteNode(data.value));

    eventBus.emit(EVENT_DELETE_NODE, { nodeId: data.value });
  });
};

export const callAddNodeService = async (msgNode: MessageNode, data: AddNodeParams) => {
  const res = await msgNode.send(new SimplexMessage(ACTION_NAME_ADD_NODE, data));
  return res;
};

export const registerAddNodeService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACTION_NAME_ADD_NODE);

  messageHub.on(ACTION_NAME_ADD_NODE, async (data: AddNodeParams) => {
    getStore().dispatch(addNode(data.value));
  });
};

export const callSelectedNodeService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new SimplexMessage(ACTION_NAME_SELECTED_NODE, data));
  return res;
};

export const registerSelectedNodeService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACTION_NAME_SELECTED_NODE);

  messageHub.on(ACTION_NAME_SELECTED_NODE, async (data: Params) => {
    getStore().dispatch(updateSelectedNode(data.value));
    await sleep(100);
    const nodeInfo = requestAccountsManager.getNodeInfo();
    const res = {
      node: {
        fullNode: nodeInfo.node.fullNode,
        solidityNode: nodeInfo.node.solidityNode,
        eventServer: nodeInfo.node.eventServer,
        chain: nodeInfo.node.chain,
      },
    };
    if (nodeInfo.connectNode) {
      Object.assign(res, {
        connectNode: {
          fullNode: nodeInfo.connectNode.fullNode,
          solidityNode: nodeInfo.connectNode.solidityNode,
          eventServer: nodeInfo.connectNode.eventServer,
          chain: nodeInfo.connectNode.chain,
        },
      });
    }
    await sendNotifyEvent('setNode', res);
  });
};
