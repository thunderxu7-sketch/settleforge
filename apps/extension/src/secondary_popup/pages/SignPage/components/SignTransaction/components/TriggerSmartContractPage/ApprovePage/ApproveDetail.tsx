import { FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import _ from 'lodash';

import { Tooltip } from 'antd';
import classNames from 'classnames';

import { useAppSelector } from '../../../../../../../../store/hooks';
import { selectLanguage } from '../../../../../../../../store/slices/settings';
import styles from '../../../../../static/scss/common.m.scss';
import { cutMiddle } from '../../../../../../../../popup/utils';
import { isCustomToken } from '../../../../../utils';
import { useSelectedNodeInfo } from '../../../../../../../../hooks/selected_node_info';
import { toolTipsOverlayInnerStyle } from '../../../../../../../../constants/style_object';

import tokenCustomDefaultImg from '../../../../../../../../static/images/token_custom_default.svg';
import token10DefaultImg from '../../../../../../../../static/images/token_10_default.svg';
import iconError from '../../../../../static/images/icon-error.svg';
import iconQuestion from '../../../../../static/images/icon-question.svg';
import iconCheck from '../../../../../static/images/icon-oval2-check.svg';
import iconSC from '../../../../../static/images/icon-sc.svg';

interface Props {
  contractInfo: false | { [key: string]: any };
  toAddress: string;
  tokenInfo: any;
  contractAddress: string;
}

const getPopupContainerFunc: () => HTMLElement = () =>
  document.querySelector('#detailContent') || document.body;

const ApproveDetail: FC<Props> = ({ contractInfo, toAddress, tokenInfo, contractAddress }) => {
  const { selectedNodeInfo } = useSelectedNodeInfo();
  const hostname = selectedNodeInfo?.hostname;
  const isWhite = _.get(contractInfo, 'isWhite', false);
  const projectName = _.get(contractInfo, 'projectName', '');
  const isContract = _.get(contractInfo, 'isContract', '');
  const tokenName = _.get(tokenInfo, 'shortName');
  const logoUrl = _.get(tokenInfo, 'logoUrl', '');
  const isCustom = isCustomToken(tokenInfo?.tokenStatus);

  const { formatMessage } = useIntl();
  const language = useAppSelector(selectLanguage);

  return (
    <div className={styles.detailContent} id="detailContent">
      <div className={styles.approveWrap}>
        <FormattedMessage id={'SIGN.APPROVE.CONFIRM.APPROVE'} />
        {isContract ? (
          <div className={classNames(styles.address, styles.beforeIcon)}>
            <span
              className={classNames(styles.addressText, 'cursorPointer')}
              onClick={(e) => {
                e.stopPropagation();
                const url = `${hostname}/contract/${toAddress}`;
                hostname && window.open(url);
              }}
            >
              <img src={iconSC} alt="" />
              {toAddress && cutMiddle(toAddress, 3, 3)}
            </span>
            <Tooltip
              overlayInnerStyle={toolTipsOverlayInnerStyle}
              placement="bottom"
              title={
                isWhite
                  ? formatMessage({ id: 'CONFIRMATIONS.PROJECT.VERIFY' }, { project: projectName })
                  : formatMessage({ id: 'CONFIRMATIONS.PROJECT.UNKNOWN' })
              }
              className={styles.tooltipImg}
              getPopupContainer={getPopupContainerFunc}
            >
              <img
                src={isWhite ? iconCheck : iconQuestion}
                className={classNames(styles.iconAfter, 'cursorPointer')}
                alt=""
              />
            </Tooltip>
          </div>
        ) : (
          contractInfo && (
            <div className={styles.address}>
              <span
                className={classNames(styles.addressText, 'cursorPointer')}
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `${hostname}/address/${toAddress}`;
                  hostname && window.open(url);
                }}
              >
                {toAddress && cutMiddle(toAddress, 3, 3)}
              </span>

              <Tooltip
                overlayInnerStyle={toolTipsOverlayInnerStyle}
                placement="bottom"
                title={formatMessage({ id: 'SIGN.APPROVE.ACCOUNT.TIPS' })}
                className={styles.tooltipImg}
                getPopupContainer={getPopupContainerFunc}
              >
                <img src={iconError} className={classNames(styles.iconAfter, 'cursorPointer')} />
              </Tooltip>
            </div>
          )
        )}
      </div>
      <div className={styles.tokenWrap}>
        <FormattedMessage id={'SIGN.APPROVE.CONFIRM.TRADE'} />
        {_.size(tokenName) > 0 && (
          <div className={styles.tokenInfo}>
            <img
              src={isCustom ? tokenCustomDefaultImg : logoUrl || token10DefaultImg}
              alt=""
              onError={(e) => {
                e.target.src = token10DefaultImg;
              }}
            />
            <div className={styles.name}>{tokenName}</div>
          </div>
        )}
        {contractAddress && (
          <div
            className={classNames(styles.address, 'cursorPointer')}
            onClick={(e) => {
              e.stopPropagation();
              const url = `${hostname}/token20/${contractAddress}`;
              hostname && window.open(url);
            }}
          >
            ({cutMiddle(contractAddress, 3, 3)})
          </div>
        )}
      </div>

      {contractInfo && !isContract && (
        <div className={styles.warnTips}>
          <FormattedMessage id={'SIGN.APPROVE.ACCOUNT'} />
        </div>
      )}

      {contractInfo && isContract && !isWhite && (
        <div className={styles.warnTips2}>
          <FormattedMessage id={'SIGN.APPROVE.UNKNOWN.PROJECT'} />
        </div>
      )}
    </div>
  );
};

export default ApproveDetail;
