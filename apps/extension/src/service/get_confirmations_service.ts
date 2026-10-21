import { ConfirmationObj } from './../domain/sign_manager';
import { msgNode } from './../popup/inst';
import { DuplexMessage, MessageHub, MessageNode, SimplexMessage } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { signManager } from '../domain/sign_manager';

const GET_CONFIRMATIONS_ACTION_NAME = 'GET_CONFIRMATIONS';
const CONFIRM_SIGN_TRANSACTION_SERVICE = 'CONFIRM_SIGN_TRANSACTION_SERVICE';
const REJECT_SIGN_TRANSACTION_SERVICE = 'REJECT_SIGN_TRANSACTION_SERVICE';
const REMOVE_SIGN_TRANSACTION_SERVICE = 'REMOVE_SIGN_TRANSACTION_SERVICE';
const CONFIRM_LEDGER_SIGN_TRANSACTION_SERVICE = 'CONFIRM_LEDGER_SIGN_TRANSACTION_SERVICE';
const REJECT_ALL_SIGN_TRANSACTION_SERVICE = 'REJECT_ALL_SIGN_TRANSACTION_SERVICE';
interface Params {
  confirmation: ConfirmationObj;
  selectedIndex: number;
  delay?: boolean;
}

interface LedgerSignParam {
  selectedIndex: number;
  signedTransaction: any;
}

export const callGetConfirmationsService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(GET_CONFIRMATIONS_ACTION_NAME));
  return res;
};

export const registerGetConfirmationsService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', GET_CONFIRMATIONS_ACTION_NAME);

  messageHub.on(
    GET_CONFIRMATIONS_ACTION_NAME,
    async (data: undefined, meta: DuplexMessageMetaType) => {
      meta.resolve({
        confirmations: signManager.getConfirmations(),
      });
    },
  );
};

export const callConfirmSignTransactionService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(CONFIRM_SIGN_TRANSACTION_SERVICE, data));
  return res;
};

export const registerConfirmSignTransactionService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', CONFIRM_SIGN_TRANSACTION_SERVICE);

  messageHub.on(CONFIRM_SIGN_TRANSACTION_SERVICE, async (data, meta: DuplexMessageMetaType) => {
    const signedTransaction = await signManager.confirmSignTransaction(
      data.confirmation,
      data.selectedIndex,
    );
    meta.resolve({
      signedTransaction,
    });
  });
};

export const callRejectSignTransactionService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(REJECT_SIGN_TRANSACTION_SERVICE, data));
  return res;
};

export const registerRejectSignTransactionService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', REJECT_SIGN_TRANSACTION_SERVICE);

  messageHub.on(REJECT_SIGN_TRANSACTION_SERVICE, async (data, meta: DuplexMessageMetaType) => {
    if (data.delay) {
      setTimeout(() => {
        signManager.rejectSignTransaction(data.confirmation, data.selectedIndex);
      }, 50);
    } else {
      await signManager.rejectSignTransaction(data.confirmation, data.selectedIndex);
    }
    meta.resolve({});
  });
};

export const callConfirmLedgerSignTransactionService = async (
  msgNode: MessageNode,
  data: LedgerSignParam,
) => {
  const res = await msgNode.send(new DuplexMessage(CONFIRM_LEDGER_SIGN_TRANSACTION_SERVICE, data));
  return res;
};

export const registerConfirmLedgerSignTransactionService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', CONFIRM_LEDGER_SIGN_TRANSACTION_SERVICE);

  messageHub.on(CONFIRM_LEDGER_SIGN_TRANSACTION_SERVICE, async (data) => {
    await signManager.confirmLedgerSignTransaction(data.selectedIndex, data.signedTransaction);
  });
};

export const registerRejectAllSignTransactionService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', REJECT_ALL_SIGN_TRANSACTION_SERVICE);

  messageHub.on(REJECT_ALL_SIGN_TRANSACTION_SERVICE, async (data, meta: DuplexMessageMetaType) => {
    await signManager.rejectAllSignTransaction();
    meta.resolve({});
  });
};

export const callRejectAllSignTransactionService = async (msgNode: MessageNode) => {
  const res = await msgNode.send(new DuplexMessage(REJECT_ALL_SIGN_TRANSACTION_SERVICE));
  return res;
};
