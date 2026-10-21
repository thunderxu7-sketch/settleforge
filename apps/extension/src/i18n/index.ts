import en from './en.json';
import zh_CN from './zh_CN.json';
import ja from './ja.json';

export const messages = {
  en,
  'zh-CN': zh_CN,
  zh: zh_CN,
  ja,
};

export type MessageLanguageType = keyof typeof messages;
