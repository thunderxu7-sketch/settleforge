import { FC, useState } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { Tooltip } from 'antd';

import { usePricesInfo } from '../../../../hooks/prices_info';
import { formatWithSpt, BigNumber } from '../../../utils/numberUtils';
import { newTokenAmountAndWorth } from '../../../utils/newTokenAmountAndWorth';

import Confirmation from '../../../../components/Confirmation';

import styles from '../CustomSortPage.m.scss';
import Verify from '../../../../static/images/icon-verify.svg';
import DelIcon from '../../../../static/images/icon-del.svg';
import MenuIcon from '../../../../static/images/icon-menu.svg';
import TokenCustomDefaultImg from '../../../../static/images/token_custom_default.svg';
import Token10DefaultImg from '../../../../static/images/token_10_default.svg';
import TokenTrxDefaultImg from '../../../../static/images/token_trx_default.svg';
import { isTopAsset } from '../../../utils/assetUtils';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

interface Props {
  token: {
    [k: string]: any;
  };
  deleteToken: any;
}

const AssetItem: FC<Props> = ({ token, deleteToken }) => {
  const { pricesInfo } = usePricesInfo();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const {
    tokenStatus,
    logoUrl,
    isOfficial,
    shortName,
    type,
    balanceStr,
    balance,
    count,
    usdCount,
    cnyCount,
  } = token;
  let { price = 0 } = token;
  const isCustomToken = tokenStatus == 1 || tokenStatus == 2;
  let amount = balanceStr || balance || count || 0;
  const { amountStr, moneyStr } = newTokenAmountAndWorth(
    price,
    amount,
    pricesInfo,
    usdCount,
    cnyCount,
  );
  let nameOne = shortName;
  if (type !== 5) amount = new BigNumber(amount).toFixed();
  if (type === 0) {
    // trx
    nameOne = 'TRX';
    price = 1;
  }
  const toDelete = () => {
    deleteToken(token);
    setConfirmModalVisible(false);
  };
  const topAsset = isTopAsset(token);

  return (
    <div className={classNames(styles.assetItem, topAsset ? styles.fix : '')}>
      <div className={classNames(styles.flAcent)}>
        <span className={styles.leftLogo}>
          {!isTopAsset(token) && (
            <Tooltip
              overlayInnerStyle={toolTipsOverlayInnerStyle}
              title={<FormattedMessage id="ASSET.CLICK_TO_UN_FOLLOW" />}
              placement="topLeft"
            >
              <img
                src={DelIcon}
                alt=""
                className={styles.delIcon}
                onClick={() => setConfirmModalVisible(true)}
              />
            </Tooltip>
          )}
          <img
            className={classNames(styles.tokenLogo)}
            src={
              type === 0
                ? TokenTrxDefaultImg
                : isCustomToken
                ? TokenCustomDefaultImg
                : logoUrl || Token10DefaultImg
            }
            onError={(e: any) => {
              e.target.src = Token10DefaultImg;
            }}
            alt=""
          />
          {Number(isOfficial === 1) ? (
            <img className={classNames(styles.verify)} src={Verify} alt="" />
          ) : null}
        </span>
        <span className={styles.symbol}>{nameOne}</span>
      </div>

      <div className={styles.flAcent}>
        <div className={classNames(styles.flCol, styles.flBottom)}>
          <div className={styles.tokenBalance}>{formatWithSpt(amountStr)}</div>
          {type !== 5 && (
            <div className={styles.tokenBalanceUsd}>{`${formatWithSpt(moneyStr)}`}</div>
          )}
        </div>
        {!topAsset && <img src={MenuIcon} alt="" className={styles.menuIcon} />}
      </div>

      <Confirmation
        show={confirmModalVisible}
        title={<FormattedMessage id="ASSET.CONFIRM.REMOVE_TOKEN" />}
        body={<FormattedMessage id="ASSET.CONFIRM.REMOVE_DESC" />}
        onClose={() => setConfirmModalVisible(false)}
        onConfirmed={() => toDelete()}
      />
    </div>
  );
};

export default AssetItem;
