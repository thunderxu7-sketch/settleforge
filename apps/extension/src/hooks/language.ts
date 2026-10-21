import { useAppSelector } from '../store/hooks';
import { selectLanguage } from '../store/slices/settings';

export const useSelectedLanguage = () => {
  const lang = useAppSelector(selectLanguage);

  const langAbbr = lang.split('-')[0];

  return {
    lang,
    langAbbr,
  };
};
