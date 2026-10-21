export const LEDGER_WEB_HID = 'web_hid';
export const LEDGER_LEDGER_LIVE = 'ledger_live';

export const CURRENCY_OPTIONS = [
  {
    value: 'CNY',
    text: 'CNY',
  },
  {
    value: 'USD',
    text: 'USD',
  },
];

export const LANGUAGE_OPTIONS = [
  { value: 'en', text: 'English' },
  { value: 'zh', text: '中文' },
  { value: 'ja', text: '日本語' },
];

export const AUTO_LOCK_OPTIONS = [
  {
    value: 60 * 1000,
    text: () => 'SETTING.TITLE.AUTO_LOCK.1_MIN',
  },
  {
    value: 5 * 60 * 1000,
    text: () => 'SETTING.TITLE.AUTO_LOCK.5_MIN',
  },
  {
    value: 15 * 60 * 1000,
    text: () => 'SETTING.TITLE.AUTO_LOCK.15_MIN',
  },
  {
    value: 60 * 60 * 1000,
    text: () => 'SETTING.TITLE.AUTO_LOCK.1_HOUR',
  },
  {
    value: 240 * 60 * 1000,
    text: () => 'SETTING.TITLE.AUTO_LOCK.4_HOUR',
  },
  {
    value: 0,
    text: () => 'SETTING.TITLE.AUTO_LOCK.NEVER',
  },
];

export const LEDGER_CONNECTION_OPTIONS = [
  { value: LEDGER_WEB_HID, text: 'Web HID' },
];
