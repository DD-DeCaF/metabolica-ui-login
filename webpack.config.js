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
                'FIREBASE_SENDER_ID',
                'IAM_API'
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
