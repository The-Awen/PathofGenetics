var path = require('path');
var webpack = require("webpack");
const webpackMerge = require("webpack-merge");
const commonConfig = require("./webpack.common.js");
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3001;

module.exports = webpackMerge(commonConfig, {
	devServer: {
		port: PORT,
		host: HOST,
		compress: true,
		historyApiFallback: true,
		watchOptions: {
			aggregateTimeout: 300,
			poll: 1000
		},
		contentBase: path.resolve("./build")
	}
});