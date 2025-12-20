const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { ConsoleLogger, LogLevel, NodeJSFileSystem } = require('@angular/compiler-cli');
const { createEs2015LinkerPlugin } = require('@angular/compiler-cli/linker/babel');
const { AngularWebpackPlugin } = require('@ngtools/webpack');

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production';
  const publicPath = isProd ? '/SnakeQuiz/' : '/';

  return {
    entry: path.resolve(__dirname, 'src/main.ts'),
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : false,
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      chunkFilename: isProd ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      publicPath,
      clean: true
    },
    ignoreWarnings: [
      // Suppress noisy sourcemap warnings from Angular/RxJS packages in dev.
      (warning) =>
        typeof warning.message === 'string' &&
        warning.message.includes('Failed to parse source map') &&
        warning.message.includes('node_modules')
    ],
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        // Strip package sourcemap comments that point to files we don't serve in dev,
        // which otherwise trigger noisy 404s in the browser console.
        ...(!isProd
          ? [
              {
                test: /\.js$/,
                include: /[\\/]node_modules[\\/]rxjs[\\/]/,
                enforce: 'pre',
                use: {
                  loader: path.resolve(__dirname, 'build/strip-rxjs-sourcemap-loader.cjs')
                }
              }
            ]
          : []),
        {
          test: /\.ts$/,
          use: ['@ngtools/webpack']
        },
        {
          test: /\.[cm]?js$/,
          include: /[\\/]node_modules[\\/]@angular[\\/]/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              babelrc: false,
              configFile: false,
              plugins: [
                createEs2015LinkerPlugin({
                  jitMode: false,
                  sourceMapping: isProd,
                  fileSystem: new NodeJSFileSystem(),
                  logger: new ConsoleLogger(LogLevel.warn)
                })
              ]
            }
          }
        },
        {
          test: /\.css$/i,
          oneOf: [
            {
              resourceQuery: /ngResource/,
              use: [
                {
                  loader: 'css-loader',
                  options: {
                    exportType: 'string'
                  }
                }
              ]
            },
            {
              use: ['style-loader', 'css-loader']
            }
          ]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.html'),
        base: publicPath
      }),
      new AngularWebpackPlugin({
        tsconfig: path.resolve(__dirname, 'tsconfig.json')
      }),
      new CopyPlugin({
        patterns: [{ from: path.resolve(__dirname, 'public'), to: '.' }]
      })
    ],
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
        publicPath
      },
      host: '0.0.0.0',
      port: 5173,
      historyApiFallback: {
        index: `${publicPath}index.html`
      }
    }
  };
};
