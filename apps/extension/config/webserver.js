// build gui webserver
process.env.NODE_ENV = 'development';

const path = require('path');
const { merge } = require('webpack-merge');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const { getConfig } = require('./webpack.common');

const distBaseDir = path.resolve('dist/ds');

const WEB_SERVER_PORT = 9000;

const VARIABLES = {
  __LOGGER_LEVEL__: JSON.stringify('debug'),
  __MODE__: JSON.stringify(process.env.MODE || 'development'),
  __TRON_PRO_API_KEY__: JSON.stringify(process.env.TRON_PRO_API_KEY || ''),
};

const config = merge(
  getConfig({
    distBaseDir,
    definedVariables: VARIABLES,
    cleanWebpack: true,
    miniCss: false,
    useSWC: true,
    entries: 'gui',
  }),
  {
    devtool: false,
  },
);

config.entry['popup'] = [
  'webpack/hot/dev-server',
  `webpack-dev-server/client?hot=true&hostname=localhost&port=${WEB_SERVER_PORT}`,
].concat(config.entry['popup']);

config.entry['secondary_popup'] = [
  'webpack/hot/dev-server',
  `webpack-dev-server/client?hot=true&hostname=localhost&port=${WEB_SERVER_PORT}`,
].concat(config.entry['secondary_popup']);

config.plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.SourceMapDevToolPlugin({
    filename: 'sourcemaps/[name].[contenthash:8].js.map',
    publicPath: `http://localhost:${WEB_SERVER_PORT}/`,
    fileContext: 'public',
  }),
].concat(config.plugins || []);

const compiler = webpack(config);

const server = new WebpackDevServer(
  {
    hot: false,
    client: false,
    host: '0.0.0.0',
    port: WEB_SERVER_PORT,
    devMiddleware: {
      writeToDisk: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: 'all',
  },
  compiler,
);

const runServer = async () => {
  console.log('Starting server...');
  await server.start();
};

runServer().then();
