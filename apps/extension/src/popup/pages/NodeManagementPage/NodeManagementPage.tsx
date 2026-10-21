import { FormattedMessage } from 'react-intl';
import { Modal } from 'antd';
import classNames from 'classnames';

import { useNodeManagementBiz } from './hook';

import NavBar from '../../../components/NavBar/NavBar';
import NodeCard from './components/NodeCard';
import Confirmation from '../../../components/Confirmation';
import Button from '../../../components/Button';

import { VALIDATION_STATE } from './constants';

import styles from './NodeManagementPage.m.scss';

import closeIcon from './images/close.svg';

const NodeManagementPage = () => {
  const {
    state,
    intl,
    isValid,
    nodeIds,
    nodeList,
    selectedNode,
    showDeleteNodeModal,
    hideDeleteNodeModal,
    deleteNode,
    showAddNodeModal,
    onCustomNameChange,
    onCustomFullNodeChange,
    onCustomEventServerChange,
    addCustomNode,
    onClickNode,
    onCloseCustomModal,
  } = useNodeManagementBiz();
  const { deleteNodeModalVisible, addNodeModalVisible, customNode } = state;
  const { name, fullNode, eventServer } = customNode;
  return (
    <div className={classNames(styles.container, 'col')}>
      <NavBar title="SETTING.TITLE.NODE_MANAGE" />

      <div className={classNames(styles.greyModal, 'col')}>
        <div className={classNames(styles.node, 'scroll')}>
          {nodeIds.map((nodeId: string) => {
            const {
              name,
              formatName,
              fullNode,
              eventServer,
              isCanDelete = false,
              formatTip,
            } = nodeList[nodeId];
            return (
              fullNode && (
                <NodeCard
                  key={nodeId}
                  nodeId={nodeId}
                  selectedNode={selectedNode}
                  formatName={formatName}
                  name={name}
                  formatTip={formatTip}
                  isCanDelete={isCanDelete}
                  showDeleteNodeModal={showDeleteNodeModal}
                  fullNode={fullNode}
                  eventServer={eventServer}
                  onClickNode={onClickNode}
                ></NodeCard>
              )
            );
          })}
        </div>
        <div className={styles.addNode} onClick={showAddNodeModal}>
          <FormattedMessage id="SETTING.TITLE.ADD_NODE" />
        </div>

        {/* delete node modal */}
        <Confirmation
          show={deleteNodeModalVisible}
          title={<FormattedMessage id="BUTTON.DELETE" />}
          body={<FormattedMessage id="CONFIRMATIONS.DELETE_NODE.BODY" />}
          onClose={hideDeleteNodeModal}
          onConfirmed={deleteNode}
        />

        {/* add custom node modal*/}
        <Modal
          title={null}
          visible={addNodeModalVisible}
          closable={true}
          closeIcon={<img src={closeIcon} />}
          footer={null}
          width={300}
          wrapClassName={styles.addNodeModalWrap}
          maskClosable={true}
          onCancel={onCloseCustomModal}
          bodyStyle={{ borderRadius: '12px', color: '#232C41' }}
        >
          <div className={styles.addNodeForm}>
            <label>
              <FormattedMessage id="SETTINGS.CUSTOM_NODE.NAME" />
            </label>
            <div className={styles.input}>
              <input
                type="text"
                value={name.value}
                placeholder={intl.formatMessage({ id: 'SETTINGS.CUSTOM_NODE.NAME.PLACEHOLDER' })}
                onChange={onCustomNameChange}
              />
            </div>
            {!isValid &&
              name.state !== VALIDATION_STATE.VALID &&
              name.state !== VALIDATION_STATE.NONE && (
                <div className={styles.tipError}>
                  <FormattedMessage id={name.state} />
                </div>
              )}
            <label>
              <FormattedMessage id="SETTINGS.NODES.FULL_NODE" />
            </label>
            <div className={styles.input}>
              <input
                type="text"
                value={fullNode.value}
                placeholder={intl.formatMessage({
                  id: 'SETTINGS.CUSTOM_NODE.FULL_NODE.PLACEHOLDER',
                })}
                onChange={onCustomFullNodeChange}
              />
            </div>
            {!isValid && fullNode.state === VALIDATION_STATE.INVALID && (
              <div className={styles.tipError}>
                <FormattedMessage id="EXCEPTION.ADD_NODE.NODE_URL" />
              </div>
            )}

            <label>
              <FormattedMessage id="SETTINGS.NODES.EVENT_SERVER" />
            </label>
            <div className={styles.input}>
              <input
                type="text"
                value={eventServer.value}
                placeholder={intl.formatMessage({
                  id: 'SETTINGS.CUSTOM_NODE.EVENT_SERVER.PLACEHOLDER',
                })}
                onChange={onCustomEventServerChange}
              />
            </div>
            {!isValid && eventServer.state === VALIDATION_STATE.INVALID && (
              <div className={styles.tipError}>
                <FormattedMessage id="EXCEPTION.ADD_NODE.NODE_URL" />
              </div>
            )}
            <Button id="SETTINGS.CUSTOM_NODE" isValid={isValid} onClick={addCustomNode} />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default NodeManagementPage;
