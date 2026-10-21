import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Tooltip } from 'antd';
import classNames from 'classnames';

import iconSelected from '../../../../static/images/icon-selected.svg';
import iconNoSelected from '../../../../static/images/icon-unselected.svg';
import iconHelp from '../../../../static/images/icon-help.svg';

import styles from '../NodeManagementPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

interface Props {
  nodeId: string;
  selectedNode: string;
  formatName: string;
  name: string;
  formatTip?: string;
  isCanDelete?: boolean;
  showDeleteNodeModal: (nodeId: string) => void;
  fullNode: string;
  eventServer: string;
  onClickNode: (nodeId: string, name: string, fullNode: string, eventServer: string) => void;
}

const NodeCard: FC<Props> = ({
  nodeId,
  selectedNode,
  formatName,
  name,
  formatTip,
  isCanDelete,
  showDeleteNodeModal,
  fullNode,
  eventServer,
  onClickNode,
}) => {
  return (
    <div className={styles.item} onClick={() => onClickNode(nodeId, name, fullNode, eventServer)}>
      <div
        className={classNames(styles.r1, {
          [styles.selected]: nodeId === selectedNode,
        })}
      >
        {nodeId === selectedNode ? (
          <img src={iconSelected} className={styles.checkImg} />
        ) : (
          <span className={styles.unCheck}></span>
        )}
        <span className={classNames(styles.ml10, styles.mr6, styles.limitWid)}>
          {formatName ? <FormattedMessage id={formatName} /> : name}
        </span>
        {formatTip && (
          <Tooltip
            placement="bottom"
            overlayInnerStyle={toolTipsOverlayInnerStyle}
            title={
              <div className="tipContent">
                <FormattedMessage id={formatTip} />
              </div>
            }
          >
            <img src={iconHelp} />
          </Tooltip>
        )}
        {isCanDelete && (
          <div
            className={styles.delete}
            onClick={(e) => {
              e.stopPropagation();
              showDeleteNodeModal(nodeId);
            }}
          />
        )}
      </div>
      <div className={styles.r2}>
        <div className={styles.cell}>
          <span>
            <FormattedMessage id="SETTINGS.NODES.FULL_NODE" />
          </span>
          {fullNode.length <= 30 && <span>{fullNode}</span>}
          {fullNode.length > 30 && (
            <span className={styles.limitWid}>{fullNode?.substring(0, 30)}...</span>
          )}
        </div>

        <div className={styles.cell}>
          <span>
            <FormattedMessage id="SETTINGS.NODES.EVENT_SERVER" />
          </span>
          {eventServer.length <= 30 && <span>{eventServer}</span>}
          {eventServer.length > 30 && (
            <span className={styles.limitWid}>{eventServer?.substring(0, 30)}...</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(NodeCard);
