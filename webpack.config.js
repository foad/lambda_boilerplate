const path = require("path");

module.exports = {
  mode: "production",
  target: "node",
  entry: {
    "create-todo": "./src/handlers/create-todo.ts",
    "read-todos": "./src/handlers/read-todos.ts",
    "update-todo": "./src/handlers/update-todo.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]/index.js",
    libraryTarget: "commonjs2",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    // Exclude AWS SDK v3 modules as they are pre-installed in Lambda runtime
    "@aws-sdk/client-dynamodb": "@aws-sdk/client-dynamodb",
    "@aws-sdk/lib-dynamodb": "@aws-sdk/lib-dynamodb",
  },
  optimization: {
    minimize: true,
  },
  devtool: "source-map",
};
