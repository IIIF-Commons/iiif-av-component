const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const express = require('express')
const webpack = require('webpack');
const pkg = require('./package.json');

const config = {
  entry: {
    IIIFAVComponent: ["./src/index.ts"],
  },
  mode: 'development',
  output: {
    libraryTarget: "umd",
    library: "IIIFAVComponent",
    umdNamedDefine: true,
    chunkFilename: "[name].[contenthash].js",
    globalObject: 'this'
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{ loader: "ts-loader" }],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
            }
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                strictMath: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
    ],
  },
  devServer: {
    compress: true,
    port: 5021,
    static: {
      directory: path.join(__dirname, 'examples'),
    }
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      PACKAGE_VERSION: `${pkg.version} (development)`,
    }),
    new HtmlWebpackPlugin({
      title: 'Examples',
      template: './examples/index.html',
      minify: false,
      inject: 'head',
    }),
    new webpack.ProvidePlugin({
      "$":"jquery",
      "jQuery":"jquery",
      "window.jQuery":"jquery",
    }),
  ]
};

module.exports = config;
