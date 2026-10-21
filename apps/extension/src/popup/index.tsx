import ReactDOM from 'react-dom';
import log from 'loglevel';

import { initGoogleAnalytics } from '../lib/ga';
import App from './App';

// @ts-ignore
log.setDefaultLevel(`${__LOGGER_LEVEL__}`);

initGoogleAnalytics();

ReactDOM.render(<App />, document.getElementById('root'));

if ((module as any).hot) {
  (module as any).hot.accept();
}
