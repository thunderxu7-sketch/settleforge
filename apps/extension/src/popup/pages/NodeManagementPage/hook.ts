import { useAddressInfo } from './../../../hooks/address_info';
import { resourceManager } from './../../../domain/resource_manager';
import { CONFIG_MAIN } from './../../../constants/api';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router';
import { useIntl } from 'react-intl';
import log from 'loglevel';

import { msgNode } from '../../inst';
import { getNodeIds, getNodeList, getSelectedNode } from '../../../store/slices/node_management';
import {
  callAddNodeService,
  callDeleteNodeService,
  callSelectedNodeService,
} from '../../../service/node_management_service';
import { useAppSelector } from '../../../store/hooks';
import { useSaveLatestLocation } from '../../../hooks/location';
import PAGES from '../../../constants/pages';
import Toast from '../../../components/Toast';
import { DEFAULT_TRONSCAN_INFO } from '../../../constants/tron_nodes';

import { VALIDATION_STATE } from './constants';
import { setGaEvent } from '../../utils/gaUtils';
import useCheckLoginBeforeAction from '../../../hooks/check_logion_before_action';

interface CustomNodeType {
  name: {
    value: string;
    state: VALIDATION_STATE | string;
  };
  fullNode: {
    value: string;
    state: VALIDATION_STATE;
  };
  eventServer: {
    value: string;
    state: VALIDATION_STATE;
  };
}
interface State {
  currentDeleteNodeId: string;
  deleteNodeModalVisible: boolean;
  addNodeModalVisible: boolean;
  customNode: CustomNodeType;
}

const initialCustomNode: CustomNodeType = {
  name: {
    value: '',
    state: VALIDATION_STATE.NONE,
  },
  fullNode: {
    value: 'https://',
    state: VALIDATION_STATE.NONE,
  },
  eventServer: {
    value: 'https://',
    state: VALIDATION_STATE.NONE,
  },
};

const initialState: State = {
  currentDeleteNodeId: '',
  deleteNodeModalVisible: false,
  addNodeModalVisible: false,
  customNode: {
    ...initialCustomNode,
  },
};

type Action =
  | {
      type: 'SHOW_DELETE_NODE_MODAL';
      payload: string;
    }
  | {
      type: 'HIDE_DELETE_NODE_MODAL';
    }
  | { type: 'DELETE_NODE'; payload: boolean }
  | { type: 'SHOW_ADD_NODE_MODAL' }
  | { type: 'HIDE_ADD_NODE_MODAL' }
  | { type: 'RESET_CUSTOM_NODE' }
  | { type: 'UPDATE_CUSTOM_NODE'; payload: CustomNodeType };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SHOW_DELETE_NODE_MODAL':
      return {
        ...state,
        currentDeleteNodeId: action.payload,
        deleteNodeModalVisible: true,
      };
    case 'HIDE_DELETE_NODE_MODAL':
      return {
        ...state,
        currentDeleteNodeId: '',
        deleteNodeModalVisible: false,
      };
    case 'SHOW_ADD_NODE_MODAL':
      return {
        ...state,
        addNodeModalVisible: true,
      };
    case 'HIDE_ADD_NODE_MODAL':
      return {
        ...state,
        addNodeModalVisible: false,
      };
    case 'RESET_CUSTOM_NODE':
      return {
        ...state,
        customNode: {
          ...initialCustomNode,
        },
      };
    case 'UPDATE_CUSTOM_NODE':
      return {
        ...state,
        customNode: { ...action.payload },
      };
    default:
      return state;
  }
};

export const useNodeManagementBiz = () => {
  useSaveLatestLocation();
  const intl = useIntl();

  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);

  const goBack = useCallback(() => {
    navigate(PAGES.PAGE_SETTINGS);
  }, [navigate]);

  const nodeIds = useAppSelector(getNodeIds);
  const nodeList = useAppSelector(getNodeList);
  const selectedNode = useAppSelector(getSelectedNode);

  const { addressInfo } = useAddressInfo();
  const selectedAddress = addressInfo?.selectedAddress;

  const showDeleteNodeModal = useCallback((nodeId: string) => {
    dispatch({ type: 'SHOW_DELETE_NODE_MODAL', payload: nodeId });
  }, []);

  const hideDeleteNodeModal = useCallback(() => {
    dispatch({ type: 'HIDE_DELETE_NODE_MODAL' });
  }, []);

  const deleteNode = useCallback(async () => {
    setGaEvent('Node Management', 'Click Delete', 'Click Delete');
    await callDeleteNodeService(msgNode, { value: state.currentDeleteNodeId });
    dispatch({ type: 'HIDE_DELETE_NODE_MODAL' });
  }, [state.currentDeleteNodeId]);

  const showAddNodeModal = useCallback(() => {
    setGaEvent('Node Management', 'Add Node', 'Add Node');
    dispatch({ type: 'SHOW_ADD_NODE_MODAL' });
  }, []);

  const isValid = useMemo(
    () =>
      state.customNode.name.state === VALIDATION_STATE.VALID &&
      state.customNode.fullNode.state === VALIDATION_STATE.VALID &&
      state.customNode.eventServer.state === VALIDATION_STATE.VALID &&
      state.customNode.fullNode.value !== 'https://' &&
      state.customNode.fullNode.value !== 'http://' &&
      state.customNode.eventServer.value !== 'https://' &&
      state.customNode.eventServer.value !== 'http://',
    [
      state.customNode.name.state,
      state.customNode.fullNode.state,
      state.customNode.eventServer.state,
      state.customNode.fullNode.value,
      state.customNode.eventServer.value,
    ],
  );

  const onCustomNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const name = value.replace(/\s{2,}/g, ' ');
      if (/^\s$/.test(name) || !name.length) {
        return dispatch({
          type: 'UPDATE_CUSTOM_NODE',
          payload: {
            ...state.customNode,
            name: {
              value: '',
              state: VALIDATION_STATE.NONE,
            },
          },
        });
      }
      const { customNode } = state;

      const nameState =
        name.trim().length <= 4
          ? 'EXCEPTION.ADD_NODE.NAME'
          : Object.values(nodeList).some((node: any) => node.name === name.trim())
          ? 'EXCEPTION.ADD_NODE.REPEAT_NAME'
          : VALIDATION_STATE.VALID;
      const obj = {
        ...customNode,
        name: {
          value: name,
          state: nameState,
        },
      };
      dispatch({ type: 'UPDATE_CUSTOM_NODE', payload: obj });
    },
    [state.customNode],
  );

  const onNodeUrlChange = useCallback(
    (value: string, type: 'fullNode' | 'eventServer') => {
      if (!value.length) {
        return dispatch({
          type: 'UPDATE_CUSTOM_NODE',
          payload: {
            ...state.customNode,
            [type]: {
              value: '',
              state: VALIDATION_STATE.NONE,
            },
          },
        });
      }

      const { customNode } = state;
      let nodeState = VALIDATION_STATE.INVALID;

      if (value == 'http://' || value == 'https://') {
        nodeState = VALIDATION_STATE.VALID;
      } else {
        try {
          const url = new URL(value);
          if (url.protocol == 'http:' || url.protocol == 'https:') {
            nodeState = VALIDATION_STATE.VALID;
          }
        } catch (err) {
          // ignore
        }
      }
      customNode[type].state = nodeState;

      const obj = {
        ...customNode,
        [type]: {
          value,
          state: nodeState,
        },
      };
      dispatch({ type: 'UPDATE_CUSTOM_NODE', payload: obj });
    },
    [state.customNode],
  );

  const onCustomFullNodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onNodeUrlChange(value, 'fullNode');
    },
    [onNodeUrlChange],
  );

  const onCustomEventServerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onNodeUrlChange(value, 'eventServer');
    },
    [onNodeUrlChange],
  );

  const addCustomNode = async () => {
    const { customNode } = state;
    const name = customNode.name.value.trim();
    const fullNode = customNode.fullNode.value.trim();
    const eventServer = customNode.eventServer.value.trim();
    const value = {
      name,
      fullNode,
      solidityNode: fullNode,
      eventServer,
      chain: '_',
      isCanDelete: true,
      chainType: 0,
      default: false,
      apiConfig: CONFIG_MAIN,
      ...DEFAULT_TRONSCAN_INFO,
    };
    await callAddNodeService(msgNode, { value });

    Toast.show({
      icon: 'success',
      content: intl.formatMessage({ id: 'SETTING.SUCCESS.ADD_NODE' }),
      duration: 3000,
      afterClose: () => {
        dispatch({ type: 'RESET_CUSTOM_NODE' });
        dispatch({ type: 'HIDE_ADD_NODE_MODAL' });
      },
    });
  };

  const onClickNode = async (
    nodeId: string,
    name: string,
    fullNode: string,
    eventServer: string,
  ) => {
    try {
      if (selectedNode === nodeId) return;
      setGaEvent('Node Management', 'Switch Node', `${name}+${fullNode}+${eventServer}`);

      await callSelectedNodeService(msgNode, { value: nodeId });

      const tTimer = setTimeout(() => {
        Toast.hide();
        Toast.show({
          icon: '',
          content: intl.formatMessage({ id: 'EXCEPTION.NETWORK.TIMEOUT' }),
        });
      }, 30000);

      Toast.show({
        icon: 'loading',
        content: '',
        duration: 0,
      });
      await resourceManager.setAllAssetList(selectedAddress, nodeId);
      clearTimeout(tTimer);
      setTimeout(() => {
        Toast.hide();
      }, Math.round(Math.random() * 400) + 1300);
    } catch (err) {
      log.info(err);
    }
  };

  useEffect(() => {
    const func = async () => {
      await resourceManager.getAllAssetList(selectedAddress, selectedNode);
    };
    func();
  }, [selectedNode, selectedAddress]);

  const onCloseCustomModal = () => {
    dispatch({ type: 'RESET_CUSTOM_NODE' });
    dispatch({
      type: 'HIDE_ADD_NODE_MODAL',
    });
  };

  return {
    state,
    goBack,
    intl,
    isValid,

    nodeIds,
    nodeList,
    selectedNode,

    showDeleteNodeModal,
    hideDeleteNodeModal,
    deleteNode: useCheckLoginBeforeAction(deleteNode),

    showAddNodeModal: useCheckLoginBeforeAction(showAddNodeModal),
    onCustomNameChange,
    onCustomFullNodeChange,
    onCustomEventServerChange,
    addCustomNode,
    onClickNode: useCheckLoginBeforeAction(onClickNode),
    onCloseCustomModal,
  };
};
