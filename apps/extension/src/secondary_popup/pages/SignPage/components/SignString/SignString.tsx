import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import TabMenu from '../TabMenu';
import TokenDescriptor from './components/TokenDescriptor';
import Details from './components/Details';
import MetaData from './components/MetaData';
import { ConfirmationObj } from '../../../../../domain/sign_manager';

import styles from '../../static/scss/common.m.scss';
interface Props {
  tabIndex: number;
  changeTab: (tabIndex: number) => void;
  confirmation: ConfirmationObj;
}
const SignString: FC<Props> = ({ tabIndex, changeTab, confirmation }) => {
  const inputString = String(confirmation.input);
  const data = inputString.replace('0x', '');

  let checkrawDataHex = false;
  if (/^[0-9a-fA-F]{64}$/.test(data)) {
    checkrawDataHex = true;
  }

  return (
    <div className={classNames(styles.signContent, 'col', 'scroll')}>
      <TokenDescriptor />
      <div className={classNames(styles.transferDetail, 'scroll', 'col')}>
        <TabMenu tabIndex={tabIndex} changeTab={changeTab}></TabMenu>
        <div className={classNames(styles.transferTabDetail, 'scroll')}>
          {tabIndex === 0 ? <Details data={data}></Details> : <MetaData data={data}></MetaData>}
          {checkrawDataHex && (
            <div className={styles.tradeWarning}>
              <FormattedMessage id="CONTRACTS.TradeSignWarning" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignString;
