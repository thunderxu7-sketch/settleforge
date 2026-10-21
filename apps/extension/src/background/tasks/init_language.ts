import { updateLanguage } from '../../store/slices/settings';
import { getDefaultLanguage } from '../../lib/language';
import { getStore } from '../../store/store';
import { sleep } from '../../lib/async_func';

export async function initLanguage() {
  // initialize language setting
  const store = getStore();
  if (!store.getState().settings.language) {
    store.dispatch(updateLanguage(getDefaultLanguage()));
    await sleep(20);
  }
}
