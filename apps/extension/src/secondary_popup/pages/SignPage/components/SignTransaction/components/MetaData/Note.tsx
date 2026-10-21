import { FC, useState } from 'react';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import classNames from 'classnames';
import { ConfirmationObj } from '../../../../../../../domain/sign_manager';
import RemarkModal from '../common/RemarkModal';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  comfirmation: ConfirmationObj;
}

const NoteMeta: FC<Props> = ({ comfirmation }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const noteHex = _.get(comfirmation, 'unSignedTransaction.raw_data.data', false);
  let noteData = '';
  if (noteHex) {
    noteData = Buffer.from(_.toString(noteHex), 'hex').toString('utf8');
  }

  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  return (
    noteHex && (
      <div className={styles.item}>
        <div className={styles.title}>{formatMessage({ id: 'CONFIRMATIONS.SEND.NOTE' })}</div>
        <div
          className={styles.content}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            openModal();
          }}
        >
          <div className={classNames(styles.noteData, styles.afterBtn)}>{noteData}</div>
        </div>
        {modalVisible && <RemarkModal remarks={noteData} hideModal={hideModal} />}
      </div>
    )
  );
};

export default NoteMeta;
