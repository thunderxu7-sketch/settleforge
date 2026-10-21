import { messages } from '../i18n';

export const getDefaultLanguage = (): string => {
  const language = navigator.languages[0];
  const languageAbbr = language.split('-')[0];
  let result = language;
  if (!(language in messages)) {
    if (languageAbbr in messages) {
      result = languageAbbr;
    } else {
      result = 'en';
    }
  }
  return result;
};
