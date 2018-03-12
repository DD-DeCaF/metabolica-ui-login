const webpackCommon = require('./webpack.config.common');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = merge(webpackCommon, {
    devtool: 'inline-source-map',
    entry: {
        main: './src/index.js'
    },
    output: {
        filename: '[chunkhash].[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: ['vendor', 'manifest'],
            minChunks: function (module) {
                return module.context
                    && module.context.indexOf('node_modules') !== -1;
            }
        }),
        new ExtractTextPlugin('[chunkhash].[name].css'),
        new HtmlWebpackPlugin({
            inject: 'head',
            template: './src/index.html',
            filename: 'index.html'
        }),
        new webpack.EnvironmentPlugin({
            'FIREBASE_API_KEY': null, // use 'development' unless process.env.NODE_ENV is defined
            'FIREBASE_AUTH_DOMAIN': null,
            'FIREBASE_DATABASE_URL': null,
            'FIREBASE_PROJECT_ID': null,
            'FIREBASE_STORAGE_BUCKET': null,
            'FIREBASE_SENDER_ID': null
          }),
    ],
    devServer: {
        historyApiFallback: true,
        proxy: {
            '/api': {
                // Set the following line to the address of the API you want to test against:
                target: process.env.METABOLICA_DEV_API_HOST || 'http://localhost',
                secure: false,
                changeOrigin: true
            }
        }
    },
});
