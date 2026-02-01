const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      engine: './src/index.ts',
      example: './examples/basic/main.ts',
      'ui-example': './examples/ui/main.ts',
      'audio-example': './examples/audio/main.ts',
      'physics-example': './examples/physics/main.ts',
      'fluid-example': './examples/physics/fluid.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './examples/basic/index.html',
        filename: 'index.html',
        chunks: ['example', 'engine']
      }),
      new HtmlWebpackPlugin({
        template: './examples/ui/index.html',
        filename: 'ui.html',
        chunks: ['ui-example', 'engine']
      }),
      new HtmlWebpackPlugin({
        template: './examples/audio/index.html',
        filename: 'audio.html',
        chunks: ['audio-example', 'engine']
      }),
      new HtmlWebpackPlugin({
        template: './examples/physics/index.html',
        filename: 'physics.html',
        chunks: ['physics-example', 'engine']
      }),
      new HtmlWebpackPlugin({
        template: './examples/physics/fluid.html',
        filename: 'fluid.html',
        chunks: ['fluid-example', 'engine']
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public',
            to: 'assets',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,
      port: 8080,
      hot: true,
      open: true
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    mode: isProduction ? 'production' : 'development'
  };
};
