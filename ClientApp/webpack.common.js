var path = require('path');
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	output: {
		path: path.resolve("./build"),
		filename: "[name].bundle.js",
		sourceMapFilename: "[name].map",
		chunkFilename: "[id].chunk.js"
	},
	devtool: "source-map",
	entry: {
		"vendor": "./src/modules/vendor.ts",
		"polyfill": "./src/modules/polyfill.ts",
		"data": "./src/modules/data.ts",
		"images": "./src/modules/images.ts",
		"main": "./src/modules/main.ts"
	},
	resolve: {
		extensions: [".ts", ".js", ".json", ".scss", ".html"],
		modules: ["src", "node_modules"]
	},
	module: {
		rules: [{
			test: /\.json$/,
			use: [{ loader: "json-loader" }]
		},
		{
			test: /\.ts$/,
			use: [
				{ loader: "angular2-template-loader" },
				{ loader: "awesome-typescript-loader", options: {} }
			]
		},
		{
			test: /\.scss$/,
			include: path.resolve("src/components/styles"),
			use: [
				{ loader: "style-loader" },
				{ loader: "css-loader" },
				{ loader: "sass-loader" },
				{ loader: "postcss-loader" }
			]
		},
		{
			test: /\.(scss|css)$/,
			exclude: path.resolve("src/components/styles"),
			use: [
				{ loader: "to-string-loader" },
				{ loader: "css-loader" },
				{ loader: "sass-loader" },
				{ loader: "postcss-loader" }
			]
		},
		{
			test: /\.html$/,
			exclude: ["src/index.html"],
			use: [{
				loader: "html-loader",
				options: {
					minimize: true,
					removeAttributeQuotes: false,
					caseSensitive: true,
					customAttrSurround: [
						[/#/, /(?:)/],
						[/\*/, /(?:)/],
						[/\[?\(?/, /(?:)/]
					],
					customAttrAssign: [/\)?\]?=/],
					conservativeCollapse: false
				}
			}]
		},
		{
			test: /\.(png|jpg|gif)$/,
			include: [path.resolve("src/assets/skill-tree/images-canvas")],
			use: [
				"file-loader",
				{
					loader: "img-loader",
					options: {
						enabled: true,
						gifsicle: { interlaced: false },
						mozjpeg: { progressive: true, arithmetic: false },
						optipng: false,
						pngquant: { floyd: 0.5, speed: 2, quality: "30" }
					}
				}
			]
		},
		{
			test: /\.(png|jpg|gif)$/,
			include: [path.resolve("src/assets/images-css")],
			use: [{ loader: "file-loader" }]
		},
		{
			test: /\.woff(2)?(\?[a-z0-9]+)?$/,
			use: [{ loader: "url-loader?limit=10000&mimetype=application/font-woff" }]
		},
		{
			test: /\.(ttf|eot|svg)(\?[a-z0-9]+)?$/,
			use: [{ loader: "file-loader" }]
		}]
	},
	plugins: [
		new webpack.optimize.CommonsChunkPlugin({
			name: ["vendor", "polyfill", "data", "images", "main"].reverse()
		}),
		new HtmlWebpackPlugin({
			template: "src/index.html",
			chunksSortMode: "dependency"
		})
	]
};