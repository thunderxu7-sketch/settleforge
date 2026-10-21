import React from 'react';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
// import BigNumber from 'bignumber.js';

import { showFormat } from '../../../../utils';
import { BigNumber } from '../../../../../../../popup/utils/numberUtils';
import styles from '../../../../static/scss/common.m.scss';
import classNames from 'classnames';
import { cutMiddle } from '../../../../../../../popup/utils';
import { BigNumberType } from '../../../../../../../constants/types';

interface Props {
  superNodeInfo: Array<{ address: string; voteCount: number | BigNumberType; name: string }>;
  hideVoteModal: () => void;
}
const VoteModal: FC<Props> = ({ superNodeInfo, hideVoteModal }) => {
  return (
    <div className={styles.confirmModalWrap}>
      <div className={classNames(styles.confirmModalBody, styles.vconfirmModalBody)}>
        {superNodeInfo?.length > 0 && (
          <div className={styles.modalTitle}>
            <FormattedMessage
              id={'CONFIRMATIONS.VOTE.LIST_NAME'}
              values={{ name: superNodeInfo[0].name, size: superNodeInfo.length }}
            />
          </div>
        )}
        <div className={classNames(styles.voteContent, styles.scroll)}>
          {superNodeInfo?.length > 0 &&
            superNodeInfo.map(({ address, voteCount, name }, index) => {
              voteCount = new BigNumber(voteCount || 0).toFormat();
              return (
                <div className={styles.voteItem} key={index}>
                  <div className={styles.nameWrap}>
                    <div className={styles.name} title={name}>
                      {`${index + 1}. ${showFormat(name)}`}
                    </div>
                    <div className={styles.address} title={address}>
                      {cutMiddle(address)}
                    </div>
                  </div>
                  <div className={styles.amount}>
                    {voteCount}&nbsp;
                    <FormattedMessage id={'CONFIRMATIONS.RESOURCE.VOTE'} />
                  </div>
                </div>
              );
            })}
          <div
            className={styles.closeBtn}
            onClick={(e) => {
              e.stopPropagation();
              hideVoteModal();
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
