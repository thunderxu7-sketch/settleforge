// Webpack common config

const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const productionMode = process.env.NODE_ENV === 'production';

function getConfig({
  distBaseDir,
  definedVariables = {},
  cleanWebpack = true,
  miniCss = true,
  useSWC = false,
  entries = 'all',
}) {
  const sourceMap = !productionMode;
  const plugins = [];

  if (cleanWebpack) {
    plugins.push(
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [distBaseDir],
      }),
    );
  }

  if (miniCss) {
    if (productionMode) {
      plugins.push(
        new MiniCssExtractPlugin({
          filename: 'static/css/[contenthash:8].css',
          chunkFilename: 'static/css/[contenthash:8].css',
        }),
      );
    } else {
      plugins.push(
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].css',
        }),
      );
    }
  }

  const copyPluginPatterns = [
    // {
    //   from: path.resolve('src/manifest.json'),
    //   to: distBaseDir,
    // },
  ];

  if (entries === 'all' || entries === 'gui') {
    copyPluginPatterns.push(
      {
        from: path.resolve('src/static/icon.png'),
        to: path.resolve(distBaseDir, 'static'),
      },
      {
        from: path.resolve('src/analytics.js'),
        to: distBaseDir,
      },
    );
  }

  if (copyPluginPatterns.length > 0) {
    plugins.push(
      new CopyPlugin({
        patterns: copyPluginPatterns,
      }),
    );
  }

  plugins.push(
    new LodashModuleReplacementPlugin({
      shorthands: true,
      collections: true,
      caching: true,
      exotics: true,
    }),
    new webpack.DefinePlugin(definedVariables),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  );

  if (entries === 'all' || entries === 'gui') {
    plugins.push(
      ...genHtmlEntryPlugins(['popup', 'secondary_popup', 'options']),
      genManifestPlugin(),
    );
  }

  if (entries === 'all' || entries === 'background') {
    plugins.push(...genScriptLoaderEntryPlugins(['background']));
  }

  let entry = {};
  if (entries === 'all') {
    entry = {
      popup: path.resolve('./src/popup/index.tsx'),
      secondary_popup: path.resolve('./src/secondary_popup/index.tsx'),
      options: path.resolve('./src/options/options.tsx'),
      background: path.resolve('./src/background/background.ts'),
      content: path.resolve('./src/content/content.ts'),
      injected: path.resolve('./src/injected/injected.ts'),
    };
  } else if (entries === 'gui') {
    entry = {
      popup: path.resolve('./src/popup/index.tsx'),
      secondary_popup: path.resolve('./src/secondary_popup/index.tsx'),
      options: path.resolve('./src/options/options.tsx'),
    };
  } else if (entries === 'background') {
    entry = {
      background: path.resolve('./src/background/background.ts'),
      content: path.resolve('./src/content/content.ts'),
      injected: path.resolve('./src/injected/injected.ts'),
    };
  }

  return {
    mode: process.env.NODE_ENV,
    entry,
    plugins: plugins,
    module: {
      rules: [
        {
          test: /\.(ts|js)x?$/,
          exclude: /node_modules/,
          loader: useSWC ? 'swc-loader' : 'babel-loader',
        },
        {
          test: /\.css$/,
          exclude: /\.m\.css$/,
          use: [
            miniCss ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: sourceMap,
                modules: {
                  localIdentName: productionMode ? '[hash:base64]' : '[path][name]__[local]',
                  mode: 'global',
                  exportLocalsConvention: 'camelCaseOnly',
                },
              },
            },
          ],
        },

        // module css
        {
          test: /\.m\.css$/,
          use: [
            miniCss ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: sourceMap,
                modules: {
                  localIdentName: productionMode ? '[hash:base64]' : '[path][name]__[local]',
                  exportLocalsConvention: 'camelCaseOnly',
                },
              },
            },
          ],
        },

        {
          test: /\.scss$/,
          exclude: /\.m\.scss$/,
          use: [
            miniCss ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: sourceMap,
                modules: {
                  mode: 'global',
                  localIdentName: productionMode ? '[hash:base64]' : '[path][name]__[local]',
                  exportLocalsConvention: 'camelCaseOnly',
                },
                esModule: false,
              },
            },
            'sass-loader',
          ],
        },

        // module scss
        {
          test: /\.m\.scss$/,
          use: [
            miniCss ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: sourceMap,
                modules: {
                  localIdentName: productionMode ? '[hash:base64]' : '[path][name]__[local]',
                  exportLocalsConvention: 'camelCaseOnly',
                },
                esModule: false,
              },
            },
            'sass-loader',
          ],
        },

        // images
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: 'static/img',
                name(resourcePath, resourceQuery) {
                  // `resourcePath` - `/absolute/path/to/file.js`
                  // `resourceQuery` - `?foo=bar`

                  if (!productionMode) {
                    return '[path][name].[ext]';
                  }

                  return '[contenthash].[ext]';
                },
              },
            },
          ],
        },

        // fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: 'static/fonts',
                name(resourcePath, resourceQuery) {
                  // `resourcePath` - `/absolute/path/to/file.js`
                  // `resourceQuery` - `?foo=bar`

                  if (!productionMode) {
                    return '[path][name].[ext]';
                  }

                  return '[contenthash].[ext]';
                },
              },
            },
          ],
        },
      ],
    },
    output: {
      // filename: '[name]/[name].js',
      filename: (pathData) => {
        return isEntries(pathData.chunk.name) ? '[name]/[name].js' : 'vendors/[name].js';
      },
      path: distBaseDir,
      pathinfo: false,
      publicPath: '/', // 必须有，不然会hot server contentScript会出错
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        buffer: require.resolve('buffer'),
        querystring: require.resolve('querystring-es3'),
        stream: require.resolve('stream-browserify'),
        events: require.resolve('events'),
        timers: require.resolve('timers-browserify'),
      },
      alias: {
        '@': path.resolve(__dirname, '../src'),
        assets: path.resolve(__dirname, '../src/assets'),
      },
    },
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      runtimeChunk: {
        name: runtimeChunk,
      },
      splitChunks: {
        chunks: excludeSplitContents,
        minChunks: 2,
      },
    },
  };
}

function genHtmlEntryPlugins(chunks) {
  return chunks.map((chunk) => {
    return new HtmlWebpackPlugin({
      title: 'SettleForge',
      filename: `${chunk}/${chunk}.html`,
      chunks: [chunk],
      template: path.resolve('./src/template/index.html'),
    });
  });
}

function genScriptLoaderEntryPlugins(chunks) {
  return chunks.map((chunk) => {
    return new HtmlWebpackPlugin({
      chunks: [chunk],
      filename: `${chunk}/script_loader.js`,
      inject: false,
      template: path.resolve('./src/template/script_loader.hbs'),
    });
  });
}

function genManifestPlugin() {
  return new HtmlWebpackPlugin({
    filename: 'manifest.json',
    inject: false,
    template: path.resolve('./src/template/manifest.hbs'),
    templateParameters: {
      hotReload: !productionMode,
    },
    minify: false,
  });
}

function runtimeChunk(chunk) {
  if (['background', 'content', 'injected'].includes(chunk.name)) {
    return false;
  }
  return 'runtime';
}

function excludeSplitContents(chunk) {
  return !['content', 'injected'].includes(chunk.name);
}

function isEntries(name) {
  return ['popup', 'secondary_popup', 'options', 'background', 'content', 'injected'].includes(
    name,
  );
}

module.exports = {
  getConfig,
};
