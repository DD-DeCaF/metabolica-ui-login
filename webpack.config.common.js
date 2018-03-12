const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");


module.exports = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    plugins:[
        new ExtractTextPlugin('[chunkhash].[name].css'),
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
                options: {
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
};
