import { useEffect, useState } from 'react';
import type { Store } from 'redux';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { HashRouter } from 'react-router-dom';

import 'normalize.css';
import 'antd/dist/antd.css';

import './common/styles/global.scss';

import { initStore } from '../store/store';
import type { MessageLanguageType } from '../i18n';
import { messages } from '../i18n';
import AppRoutes from './pages/routes';
import { useAppSelector } from '../store/hooks';
import { selectLanguage } from '../store/slices/settings';
import { msgNode } from '../popup/inst';

const IntledApp = () => {
  const language = useAppSelector(selectLanguage) as MessageLanguageType;

  return (
    <IntlProvider locale={language} messages={messages[language]}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </IntlProvider>
  );
};

const ReduxedApp = () => {
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    (async () => {
      await msgNode.init();

      const store = await initStore();
      setStore(store);
    })();
  }, []);

  if (!store) {
    return null;
  }

  return (
    <Provider store={store}>
      <IntledApp />
    </Provider>
  );
};

export default ReduxedApp;
