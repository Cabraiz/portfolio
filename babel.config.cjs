module.exports = {
  targets: { node: "current" },
  parserOpts: { plugins: ["jsx"] },
  presets: [
    "@babel/preset-env",
    "@babel/preset-typescript",
  ],
};
