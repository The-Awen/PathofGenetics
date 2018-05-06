var webpack = require("webpack");
const webpackMerge = require("webpack-merge");
const commonConfig = require("./webpack.common.js");

module.exports = webpackMerge.smart(commonConfig,
{
	plugins:
	[
		new webpack.optimize.UglifyJsPlugin({mangle: false})
	]
});
