import { MessageHub, MessageNode, SimplexMessage } from '../lib/bg_msg';

import {
  toggleBalanceVisible,
  updateAutoLock,
  updateCurrency,
  updateLanguage,
  updateLedgerConnection,
} from '../store/slices/settings';
import { getStore } from '../store/store';

interface Params {
  value: string;
}

interface ParamsNum {
  value: number;
}

const ACTION_NAME_CURRENCY = 'SETTINGS_CURRENCY';
const ACTION_NAME_LANGUAGE = 'SETTINGS_LANGUAGE';
const ACTION_NAME_AUTOLOCK = 'SETTINGS_AUTOLOCK';
const ACTION_NAME_LEDGER_CONNECTION = 'SETTINGS_LEDGER_CONNECTION';
const ACTION_TOGGLE_BALANCE_VISIBLE = 'TOGGLE_BALANCE_VISIBLE';

export const callCurrencyService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new SimplexMessage(ACTION_NAME_CURRENCY, data));
  return res;
};

export const registerCurrencyService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACTION_NAME_CURRENCY);

  messageHub.on(ACTION_NAME_CURRENCY, async (data: Params) => {
    getStore().dispatch(updateCurrency(data.value));
  });
};

export const callLanguageService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new SimplexMessage(ACTION_NAME_LANGUAGE, data));
  return res;
};

export const registerLanguageService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACTION_NAME_LANGUAGE);

  messageHub.on(ACTION_NAME_LANGUAGE, async (data: Params) => {
    getStore().dispatch(updateLanguage(data.value));
  });
};

export const callAutoLockService = async (msgNode: MessageNode, data: ParamsNum) => {
  const res = await msgNode.send(new SimplexMessage(ACTION_NAME_AUTOLOCK, data));
  return res;
};

export const registerAutoLockService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACTION_NAME_AUTOLOCK);

  messageHub.on(ACTION_NAME_AUTOLOCK, async (data: ParamsNum) => {
    getStore().dispatch(updateAutoLock(data.value));
  });
};

export const callLedgerConnectionService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new SimplexMessage(ACTION_NAME_LEDGER_CONNECTION, data));
  return res;
};

export const registerLedgerConnectionService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACTION_NAME_LEDGER_CONNECTION);

  messageHub.on(ACTION_NAME_LEDGER_CONNECTION, async (data: Params) => {
    getStore().dispatch(updateLedgerConnection(data.value));
  });
};

export const callToggleBalanceVisibleService = async (msgNode: MessageNode) => {
  await msgNode.send(new SimplexMessage(ACTION_TOGGLE_BALANCE_VISIBLE));
};

export const registerToggleBalanceService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', ACTION_TOGGLE_BALANCE_VISIBLE);

  messageHub.on(ACTION_TOGGLE_BALANCE_VISIBLE, async () => {
    getStore().dispatch(toggleBalanceVisible());
  });
};
