import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classnames from 'classnames';

import { AddressItemType } from '../../../../store/slices/address_info';

import { NODE_FORMAT_ID } from '../../../../constants/tron_nodes';

import styles from '../static/scss/common.m.scss';

interface Props {
  selectedAddressItem: AddressItemType;
  selectedNode: string;
}

const SignNetwork: FC<Props> = ({ selectedAddressItem, selectedNode }) => {
  const name = selectedAddressItem?.name || '';
  const { net, chain } = NODE_FORMAT_ID[selectedNode] || {
    net: 'CONFIRMATIONS.NEW.NETWORK.MAIN_NET',
    chain: 'CONFIRMATIONS.NEW.NETWORK.MAINCHAIN',
  };
  return (
    <div className={classnames(styles.network, 'paddingLR16')}>
      <span className={styles.walletName}>{name}</span>
      <span>
        <FormattedMessage id={net} /> / <FormattedMessage id={chain} />
      </span>
    </div>
  );
};

export default memo(SignNetwork);
