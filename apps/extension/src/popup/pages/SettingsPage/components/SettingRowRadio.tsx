import { FC, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import { setGaEvent } from '../../../utils/gaUtils';

import iconEnter from '../images/icon-enter.svg';
import iconSelected from '../../../../static/images/icon-selected.svg';
import iconNoSelected from '../../../../static/images/icon-no-selected.svg';

import styles from '../SettingsPage.m.scss';

type TEXT_FUNC = () => string;

type OPTIONS_ITEM = {
  value: string | number;
  text: TEXT_FUNC | string;
};

interface Props {
  name: string;
  icon: string;
  options: OPTIONS_ITEM[];
  optionVisible?: boolean;
  tips?: string;
  onClickRow: () => void;
  selectedValue: string | number;
  onChangeStringValue?: (value: string) => Promise<void>;
  onChangeNumberValue?: (value: number) => Promise<void>;
  getSelectedText: () => string | number;
}

const SettingRowRadio: FC<Props> = ({
  icon,
  name,
  options,
  optionVisible,
  tips,
  onClickRow,
  selectedValue,
  onChangeStringValue,
  onChangeNumberValue,
  getSelectedText,
}) => {
  const onChangeValue = async (value: string | number) => {
    if (typeof value === 'string') {
      onChangeStringValue && onChangeStringValue(value);
      return;
    }
    onChangeNumberValue && onChangeNumberValue(value);
  };
  return (
    <>
      <div onClick={onClickRow} className={classNames(styles.option, 'flex')}>
        <div className={styles.rowLeft}>
          <img src={icon} alt="" />
        </div>
        <div
          className={classNames(styles.rowRight, { [styles.borderBottom]: !optionVisible }, 'flex')}
        >
          <span>
            <FormattedMessage id={name} />
          </span>
          <span>
            <span className={styles.selectedText}>{getSelectedText()}</span>
            <img
              src={iconEnter}
              className={classNames({ [styles.rotate90]: optionVisible })}
              alt=""
            />
          </span>
        </div>
      </div>
      <div
        className={classNames(styles.radioOpts, {
          [styles.borderBottom]: optionVisible,
          hide: !optionVisible,
        })}
      >
        {tips && (
          <div className={styles.connectTips}>
            <FormattedMessage id="WALLET.LEDGER.CONNECT_EXPLAIN" />
          </div>
        )}
        {options.map((item: OPTIONS_ITEM, index: number) => {
          const showText =
            typeof item.text === 'function' ? <FormattedMessage id={item.text()} /> : item.text;
          return (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onChangeValue(item.value);
                if (item.value === 'en') {
                  setGaEvent('Language', 'Switch to English', 'Switch to English');
                } else if (item.value === 'zh') {
                  setGaEvent('Language', 'Switch to Chinese', 'Switch to Chinese');
                }
              }}
              className={classNames(styles.optionItem, 'flex', {
                [styles.selected]: item.value === selectedValue,
              })}
            >
              <img src={item.value === selectedValue ? iconSelected : iconNoSelected} />
              <span className={styles.unit}>{showText}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default memo(SettingRowRadio);
