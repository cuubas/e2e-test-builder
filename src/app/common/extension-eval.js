module.exports = function () {
  eval('with(arguments[0]){var module = undefined;' + arguments[1] + '}');
};