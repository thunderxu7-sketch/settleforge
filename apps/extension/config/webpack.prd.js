// Webpack prd config
process.env.NODE_ENV = 'production';
process.env.BROWSERSLIST_ENV = 'production:chrome';

const path = require('path');
const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const { getConfig } = require('./webpack.common');

const distBaseDir = path.resolve('dist/prd');

const VARIABLES = {
  __LOGGER_LEVEL__: JSON.stringify('info'),
  __MODE__: JSON.stringify(process.env.MODE || 'development'),
  __TRON_PRO_API_KEY__: JSON.stringify(process.env.TRON_PRO_API_KEY || ''),
};

module.exports = merge(
  getConfig({
    distBaseDir,
    definedVariables: VARIABLES,
    cleanWebpack: true,
    miniCss: true,
  }),
  {
    optimization: {
      moduleIds: 'deterministic',
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            // compress: {
            //   drop_console: true,
            // },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
    },
  },
);
