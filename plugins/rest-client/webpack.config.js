const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",
  target: "node",
  entry: "./src/index.ts",
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: "[name].js.map",
    }),
    new CopyWebpackPlugin({
      patterns: [{
        from: "src/*/**.template.ts", to({ context, absoluteFilename, }) {
          return path.join(__dirname, 'dist', absoluteFilename.replace(/^.*[\\\/]/, ''));
        },
      }],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  optimization: {
    minimize: false
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs2",
    clean: true,
  },
};
