const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

/** @type {import("webpack").Configuration} */
module.exports = {
  mode: "production",
  target: "node",
  entry: "./src/index.ts",
  externals: ["@amplication/code-gen-utils", "@amplication/code-gen-types"],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/static", to: "static", noErrorOnMissing: true },
        { from: "src/templates", to: "templates", noErrorOnMissing: true },
      ],
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
    extensions: [".ts", ".js", ".json"],
    plugins: [new TsconfigPathsPlugin()],
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs2",
    clean: true,
  },
};
