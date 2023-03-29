import { Configuration } from 'webpack';
const Dotenv = require("dotenv-webpack");

const webpackConfig: Configuration = {
  plugins: [new Dotenv()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};

export default webpackConfig;
