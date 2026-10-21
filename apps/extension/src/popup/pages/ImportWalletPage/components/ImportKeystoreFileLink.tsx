import { FC, memo, useCallback, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tooltip } from 'antd';

import {
  bytesToString,
  hexStr2byteArray,
  isKeystoreWallet,
  isTronscanKeystore,
  readFileContentsFromEvent,
} from '../utils';
import Toast from '../../../../components/Toast';

import TooltipImg from '../images/tooltip.svg';

import styles from './../ImportWalletPage.m.scss';
import { toolTipsOverlayInnerStyle } from '../../../../constants/style_object';

interface Props {
  onTextChange: (content: string) => void;
}

const ImportKeystoreFileLink: FC<Props> = ({ onTextChange }) => {
  const ref = useRef(null);
  const { formatMessage } = useIntl();

  const checkKeystore = useCallback((contents: any) => {
    try {
      if (isKeystoreWallet(contents)) {
        return contents;
      }
      const jsonStr = bytesToString(hexStr2byteArray(contents));

      if (isTronscanKeystore(jsonStr)) {
        return jsonStr;
      }
      throw new Error('not keystore');
    } catch (e) {
      Toast.show({
        icon: 'fail',
        content: formatMessage({ id: 'CREATION.RESTORE.KEY_STORE.EXCEPTION.FILE_ERROR' }),
      });
      return false;
    }
  }, []);

  const changeHandler = useCallback(
    async (e: any) => {
      if (e.target.value.endsWith('.txt')) {
        const contents = await readFileContentsFromEvent(e);
        const decodeContents = checkKeystore(contents);
        // @ts-ignore
        ref.current.value = '';
        if (decodeContents) {
          onTextChange(decodeContents);
        }
      }
    },
    [onTextChange],
  );

  return (
    <p className={styles.walletTips}>
      <input type="file" ref={ref} accept=".txt" onChange={changeHandler} />
      <FormattedMessage id="WALLT.IMPORT.FILE_IMPORT" />
      <Tooltip
        placement="top"
        overlayStyle={{ maxWidth: '200px' }}
        overlayInnerStyle={toolTipsOverlayInnerStyle}
        title={formatMessage({ id: 'WALLET.IMPORT.MNEMONIC_TIP_WARN' })}
      >
        <img style={{ zIndex: 1, position: 'relative', marginLeft: 4 }} src={TooltipImg} alt="" />
      </Tooltip>
    </p>
  );
};

export default memo(ImportKeystoreFileLink);
