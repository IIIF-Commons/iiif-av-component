const path = require('path');

function resolvePath(p) {
  return path.resolve(__dirname, p);
}

const config = {
  entry: {
    IIIFAVComponent: ['./src/index.ts'],
  },
  externals: {
    'node-fetch': 'node-fetch',
    'fetch-cookie/node-fetch': 'fetch-cookie/node-fetch',
    'form-data': 'form-data',
    url: 'url',
  },
  output: {
    path: resolvePath('dist-umd'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'IIIFAVComponent',
    umdNamedDefine: true,
    // https://github.com/webpack/webpack/issues/6784#issuecomment-375941431
    globalObject: "typeof self !== 'undefined' ? self : this",
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  optimization: {
    minimize: true,
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
};

if (process.env.NODE_WEBPACK_LIBRARY_PATH) {
  config.output.path = resolvePath(process.env.NODE_WEBPACK_LIBRARY_PATH);
}

if (process.env.NODE_WEBPACK_LIBRARY_TARGET) {
  config.output.libraryTarget = process.env.NODE_WEBPACK_LIBRARY_TARGET;
}

module.exports = config;
