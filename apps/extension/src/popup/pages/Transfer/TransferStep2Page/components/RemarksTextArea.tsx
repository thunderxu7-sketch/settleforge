import { FC, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from '../TransferStep2Page.m.scss';

interface Props {
  remarks: string;
  setShowRemarks: (isShow: boolean) => void;
  setRemarks: (remarks: string) => void;
  setShowModal: (isShow: boolean) => void;
}

const RemarksTextArea: FC<Props> = ({ remarks, setShowRemarks, setRemarks, setShowModal }) => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.remarksTextArea}>
      <div
        className={styles.title}
        onClick={() => {
          setShowRemarks(false);
        }}
      >
        <span>
          <FormattedMessage id="ACCOUNT.SEND.NOTE" />
          <i></i>
        </span>
        <p className={styles.remarksNumber}>
          {remarks.length === 0 ? 0 : <span>{remarks.length}</span>}/200
        </p>
      </div>
      <div className={styles.textAreaBox}>
        <textarea
          value={remarks}
          maxLength={200}
          placeholder={formatMessage({ id: 'ACCOUNT.SEND.NOTE_DESC' })}
          onChange={(e) => {
            setRemarks(e.target.value);
          }}
        ></textarea>
        {remarks.length > 0 && (
          <div
            className={styles.cleanBtn}
            onClick={() => {
              setShowModal(true);
            }}
          >
            <FormattedMessage id="ACCOUNT.SEND.CLEAN" />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(RemarksTextArea);
