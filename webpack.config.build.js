const webpackCommon = require('./webpack.config.common');
const merge = require('webpack-merge');
const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const config = merge(webpackCommon, {
  devtool: 'source-map',
  entry: {
    main: './src/index.js'
  },
  target: 'node',
  externals: [nodeExternals()],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: "test-package",
    libraryTarget: "umd",
  },
});

// This won't modify webpackCommon.
config.module.rules[5].options = {
  compilerOptions: {
    module: 'commonjs',
    declaration: true,
  }
};

module.exports = config;
