// Webpack dev config
process.env.NODE_ENV = 'development';

const path = require('path');
const { merge } = require('webpack-merge');

const { getConfig } = require('./webpack.common');

const distBaseDir = path.resolve('dist/dev');

const VARIABLES = {
  __LOGGER_LEVEL__: JSON.stringify('debug'),
  __MODE__: JSON.stringify(process.env.MODE || 'development'),
  __TRON_PRO_API_KEY__: JSON.stringify(process.env.TRON_PRO_API_KEY || ''),
};

module.exports = merge(
  getConfig({
    distBaseDir,
    definedVariables: VARIABLES,
    cleanWebpack: true,
    miniCss: false,
    useSWC: false,
  }),
  {
    devtool: 'inline-source-map', // support development mode
  },
);
