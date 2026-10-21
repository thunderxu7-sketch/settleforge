import { FC, memo, useEffect } from 'react';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router';
import _ from 'lodash';

import { useAppSelector } from '../../../../../store/hooks';
import { selectLanguage } from '../../../../../store/slices/settings';
import { AddressValueStatusType } from '../hook';
import Button from '../../../../../components/Button';

import styles from '../CustomPage.m.scss';

interface Props {
  abbr?: string;
  name?: string;
  type?: number;
  decimal?: number;
  inputAbbr: string;
  inputName: string;
  afterAddrChange: (searchKey: string) => void;
  address: AddressValueStatusType;
  onNextBtnClick: () => void;
  setInputAbbr: (value: string) => void;
  setInputName: (value: string) => void;
}

const CustomInfo: FC<Props> = ({
  abbr,
  name,
  type,
  decimal,
  address,
  inputAbbr,
  inputName,
  afterAddrChange,
  onNextBtnClick,
  setInputAbbr,
  setInputName,
}) => {
  const { formatMessage } = useIntl();
  const location = useLocation();
  const language = useAppSelector(selectLanguage);
  const { searchKey } = (location.state as any) ?? {};

  useEffect(() => {
    if (searchKey) {
      afterAddrChange(searchKey);
    }
  }, []);

  return (
    <>
      <div className={classNames(styles.customToken, 'scroll')}>
        <div className={styles.tip}>
          <FormattedMessage id="ASSET.CUSTOM.DESCRIPTION" />
          <span
            className={styles.detailLink}
            onClick={() => {
              if (language === 'zh') {
                window.open('https://support.tronlink.org/hc/zh-cn/articles/4580250299289');
              } else {
                window.open('https://support.tronlink.org/hc/en-us/articles/4580250299289');
              }
            }}
          >
            <FormattedMessage id="ASSET.CUSTOM.DETAIL_URL" />
          </span>
        </div>

        <div className={styles.customItem}>
          <div className={styles.title}>
            <FormattedMessage id="ASSET.CUSTOM.TITLE.CONTRACT_ADDRESS" />
          </div>
          <div className={styles.input}>
            <input
              type="text"
              placeholder={formatMessage({ id: 'ASSET.CUSTOM.TITLE.CONTRACT_ADDRESS' })}
              onChange={(e) => afterAddrChange(e.target.value)}
              value={address?.value}
              className={classNames(styles.hover, address?.error ? styles.error : '')}
            />
          </div>
          <div className={styles.error}>{address?.error}</div>
        </div>

        {address?.step !== 0 && (
          <div className={styles.disableInput}>
            <div className={styles.customItem}>
              <div className={styles.title}>
                <FormattedMessage id="ASSET.CUSTOM.TITLE.ABBR" />
              </div>
              <div className={styles.input}>
                <input
                  type="text"
                  disabled={_.size(abbr) > 0}
                  value={inputAbbr}
                  onChange={(e) => {
                    const value = _.get(e, 'target.value', '').trim();
                    if (_.size(value) <= 10) {
                      setInputAbbr(value);
                    }
                  }}
                />
              </div>
            </div>

            <div className={styles.customItem}>
              <div className={styles.title}>
                <FormattedMessage id="ASSET.CUSTOM.TITLE.NAME" />
              </div>
              <div className={styles.input}>
                <input
                  type="text"
                  value={inputName}
                  disabled={_.size(name) > 0}
                  onChange={(e) => {
                    const value = _.get(e, 'target.value', '').trim();
                    if (_.size(value) <= 30) {
                      setInputName(value);
                    }
                  }}
                />
              </div>
            </div>

            <div className={styles.customItem}>
              <div className={styles.title}>
                <FormattedMessage id="ASSET.CUSTOM.TITLE.DECIMALS" />
              </div>
              <div className={styles.input}>
                <input type="text" defaultValue={decimal} disabled={true} />
              </div>
            </div>

            <div className={styles.customItem}>
              <div className={styles.title}>
                <FormattedMessage id="ASSET.CUSTOM.TITLE.TOKEN_TYPE" />
              </div>
              <div className={styles.input}>
                <input type="text" defaultValue={type == 2 ? 'TRC20' : 'TRC721'} disabled={true} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className={classNames(styles.button)}>
        <Button
          id={'BUTTON.NEXT_STEP'}
          isValid={
            (address?.step === 0 && _.size(address?.value) > 0 && _.size(address?.error) === 0) ||
            (address?.step === 1 && _.size(inputAbbr) > 0)
          }
          onClick={(e) => {
            e.stopPropagation();
            onNextBtnClick();
          }}
        />
      </div>
    </>
  );
};

export default memo(CustomInfo);
