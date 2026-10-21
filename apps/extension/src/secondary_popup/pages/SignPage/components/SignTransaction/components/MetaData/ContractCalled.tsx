import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
// @ts-ignore
import TronWeb from 'tronweb';
import _ from 'lodash';

import { useSelectedNodeInfo } from '../../../../../../../hooks/selected_node_info';
import { cutMiddle } from '../../../../../../../popup/utils';

import iconSC from '../../../../static/images/icon-sc.svg';
import styles from '../../../../static/scss/common.m.scss';

interface Props {
  contractAddress: string;
  shortName: string;
}
const ContractCalled: FC<Props> = ({ contractAddress, shortName }) => {
  contractAddress = TronWeb.address.fromHex(contractAddress);

  const { selectedNodeInfo } = useSelectedNodeInfo();
  const hostname = selectedNodeInfo?.hostname;
  return (
    <div className={styles.item}>
      <div className={styles.title}>
        <FormattedMessage id={'CONFIRMATIONS.TITLE.CONTRACT'} />
      </div>
      <div className={styles.content}>
        <div
          className={styles.contractAddress}
          onClick={(e) => {
            e.stopPropagation();
            let type = 'contract';
            if (shortName) {
              type = 'token20';
            }
            const url = `${hostname}/${type}/${contractAddress}`;
            hostname && window.open(url);
          }}
        >
          <img src={iconSC} />
          {cutMiddle(contractAddress)}
        </div>
        {shortName && <div className={styles.tokenName}>{shortName}</div>}
      </div>
    </div>
  );
};

export default ContractCalled;
