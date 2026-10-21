import { MessageHub, MessageNode, SimplexMessage } from '../lib/bg_msg';
import { updateTransferRecord, TransferRecordItemState } from '../store/slices/transfer_record';
import { getStore } from '../store/store';

const UPDATE_TRANSFER_RECORD_ACTION_NAME = 'UPDATE_TRANSFER_RECORD';

export const callUpdateTransferRecordService = async (
  msgNode: MessageNode,
  data: TransferRecordItemState,
) => {
  const res = await msgNode.send(new SimplexMessage(UPDATE_TRANSFER_RECORD_ACTION_NAME, data));
  return res;
};

export const registerUpdateTransferRecordService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', UPDATE_TRANSFER_RECORD_ACTION_NAME);

  messageHub.on(UPDATE_TRANSFER_RECORD_ACTION_NAME, async (data: TransferRecordItemState) => {
    getStore().dispatch(updateTransferRecord(data));
    return;
  });
};
