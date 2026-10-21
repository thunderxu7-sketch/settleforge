import { FC, memo, ReactElement, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tooltip } from 'antd';

import Toast from '../../../../../components/Toast';

import styles from '../TokenDetailPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../../constants/style_object';

type Info = {
  name: string;
  value: string | number | ReactElement;
};

interface Props {
  name: string;
  id: string;
  type: number;
  contractAddress: string;
  homePage: string;
  issueAddress: string;
  tokenDesc: string;
  precision: number;
}

const TokenInfo: FC<Props> = ({
  name,
  id,
  type,
  contractAddress,
  homePage,
  issueAddress,
  tokenDesc,
  precision,
}) => {
  const { formatMessage } = useIntl();

  const infoArr: Info[] = [
    {
      name: formatMessage({ id: 'ASSET.COLLECTION.TOKEN_NAME' }),
      value: name || '--',
    },
    {
      name: 'URL',
      value: homePage || '--',
    },
    {
      name: formatMessage({ id: 'ASSET.COLLECTION.ISSUER' }),
      value: issueAddress || '--',
    },
    {
      name: formatMessage({ id: 'ASSET.COLLECTION.INTRODUCTION' }),
      value: tokenDesc || '--',
    },
  ];

  if (type === 1) {
    infoArr.splice(1, 0, { name: 'ID', value: id ?? '--' });
  }
  if (type === 2) {
    infoArr.splice(3, 0, {
      name: formatMessage({ id: 'ASSET.TOKEN.DECIMALS' }),
      value: precision ?? '--',
    });
    infoArr.splice(2, 0, {
      name: formatMessage({ id: 'ASSET.COLLECTION.CONTRACT_ADDRESS' }),
      value: (
        <>
          {contractAddress || '--'}
          <Tooltip
            overlayInnerStyle={toolTipsOverlayInnerStyle}
            title={formatMessage({
              id: 'TOOLTIP.COPY',
            })}
          >
            <i
              onClick={async (e) => {
                Toast.show({
                  icon: 'success',
                  content: formatMessage({ id: 'TOAST.COPY' }),
                });
                await window.navigator.clipboard.writeText(contractAddress);
              }}
            ></i>
          </Tooltip>
        </>
      ),
    });
  }
  if (type === 5) {
    infoArr.splice(2, 0, {
      name: formatMessage({ id: 'ASSET.COLLECTION.CONTRACT_ADDRESS' }),
      value: (
        <>
          {contractAddress || '--'}
          <Tooltip
            overlayInnerStyle={toolTipsOverlayInnerStyle}
            title={formatMessage({
              id: 'TOOLTIP.COPY',
            })}
          >
            <i
              onClick={async (e) => {
                Toast.show({
                  icon: 'success',
                  content: formatMessage({ id: 'TOAST.COPY' }),
                });
                await window.navigator.clipboard.writeText(contractAddress);
              }}
            ></i>
          </Tooltip>
        </>
      ),
    });
  }
  return (
    <div className={styles.tokenInfo}>
      <div className={styles.title}>
        <i></i>
        <FormattedMessage id="ASSET.COLLECTION.PROJECT_DETAIL" />
      </div>
      <div className={styles.infoList}>
        {infoArr.map((item) => {
          return (
            <div key={item.name} className={styles.infoItem}>
              <p className={styles.name}>{item.name}</p>
              <p className={styles.value}>{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(TokenInfo);
