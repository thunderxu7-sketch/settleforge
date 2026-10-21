import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import classNames from 'classnames';

import { useSelectedNodeInfo } from '../../../../../../../hooks/selected_node_info';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  tokenID: string;
}

const TokenIDMeta: FC<Props> = ({ tokenID = '' }) => {
  const { selectedNodeInfo } = useSelectedNodeInfo();
  const hostname = selectedNodeInfo?.hostname;
  return (
    tokenID && (
      <div className={styles.item}>
        <div className={styles.title}>
          <FormattedMessage id={`ASSET.ASSET.ID`} />
        </div>
        <div
          className={classNames(styles.tokenId)}
          onClick={(e) => {
            e.stopPropagation();

            const url = `${hostname}/token/${tokenID}`;
            hostname && window.open(url);
          }}
        >
          {tokenID}
        </div>
      </div>
    )
  );
};

export default TokenIDMeta;
