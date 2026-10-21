import { FC } from 'react';
import { FormattedMessage } from 'react-intl';

import { cutMiddle } from '../../../../../../popup/utils';

import iconArrowBold from '../../../static/images/icon-arrow-bold.svg';

import styles from '../../../static/scss/common.m.scss';

interface Props {
  fromAddress: string;
  toAddress: string;
  fromAddressName: string;
  toAddressName: string;
}
const ResourceCost: FC<Props> = ({ fromAddress, toAddress, fromAddressName, toAddressName }) => {
  return <div className={styles.resourceCostContainer}></div>;
};

export default ResourceCost;
