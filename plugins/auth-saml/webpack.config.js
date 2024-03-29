const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

/** @type {import("webpack").Configuration} */
module.exports = {
  mode: "production",
  target: "node",
  entry: "./src/index.ts",
  externals: ["@amplication/code-gen-utils", "@amplication/code-gen-types"],
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: "[name].js.map",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: `${path.dirname(
            require.resolve(`@amplication/auth-core/package.json`),
          )}/src/static`,
          to: "static",
          priority: 1,
        },
        {
          from: `${path.dirname(
            require.resolve(`@amplication/auth-core/package.json`),
          )}/src/templates`,
          to: "templates",
          priority: 1,
        },
        {
          from: "src/static",
          to: "static",
          noErrorOnMissing: true,
          force: true,
          priority: 2,
        },
        {
          from: "src/templates",
          to: "templates",
          noErrorOnMissing: true,
          force: true,
          priority: 2,
        },
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
  },
  optimization: {
    minimize: false,
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs2",
    clean: true,
  },
};
