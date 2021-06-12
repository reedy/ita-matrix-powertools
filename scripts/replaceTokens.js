const package = require("../package.json");

const tokens = {
  __VERSION__: package.version,
  __DESCRIPTION__: package.description
};

module.exports = {
  tokens,
  replace: function(value) {
    return Object.keys(tokens).reduce(
      (res, token) => res.replace(token, tokens[token]),
      value
    );
  }
};
