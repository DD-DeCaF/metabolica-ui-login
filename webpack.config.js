// Copyright 2018 Novo Nordisk Foundation Center for Biosustainability, DTU.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');

module.exports = function () {
    return {
        entry: {
			main: './src/index.js'
		},
        output: {
			filename: '[chunkhash].[name].js',
			path: path.resolve(__dirname, 'dist')
        },
        resolve: {
          extensions: ['.ts', '.tsx', '.js']
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
            new webpack.EnvironmentPlugin([
                'FIREBASE_API_KEY',
                'FIREBASE_AUTH_DOMAIN',
                'FIREBASE_DATABASE_URL',
                'FIREBASE_PROJECT_ID',
                'FIREBASE_STORAGE_BUCKET',
                'FIREBASE_SENDER_ID'
            ])
        ],
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract({
                        use: 'css-loader'
                    })
                },
                {
                    test: /\.scss$/,
                    use: ExtractTextPlugin.extract({
                        use: [{
                            loader: 'css-loader'
                        }, {
                            loader: 'sass-loader'
                        }]
                    })
                },
                {
                    test: /\.js$/,
                    include: [
                        path.resolve(__dirname, 'src'),
                        path.dirname(require.resolve('metabolica'))
                    ],
                    loader: 'babel-loader',
                    query: {
                        presets: ['es2015', 'stage-0'],
                        plugins: ['transform-runtime']
                    }
                },
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    include: [
                        path.resolve(__dirname, 'src'),
						path.dirname(require.resolve('metabolica')),
						__dirname
                    ],
                    options: {
                        transpileOnly: false
                    }
                },
                {
                    test: /\.js$/,
                    enforce: 'pre',
                    include: [
                        path.resolve(__dirname, 'src'),
						path.dirname(require.resolve('metabolica'))
                    ],
                    loader: 'eslint-loader',
                    options: {
                        failOnError: true
                    }
                },
                {
                    test: /\.html$/,
                    include: [
                        path.resolve(__dirname, 'src'),
						path.dirname(require.resolve('metabolica'))
                    ],
                    loader: 'html-loader',
                    query: {
                        minimize: true
                    }
                },
                {
                    test: /\.(jpe?g|png|svg)$/,
                    include: [
                        path.resolve(__dirname, 'img'),
						path.dirname(require.resolve('metabolica')),
						__dirname
                    ],
                    loader: 'file-loader?name=[path][name].[ext]'
                }
            ]
        },
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
        }
    }
};
