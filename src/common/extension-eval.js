module.exports = function () {
  var module = undefined;
  with (arguments[0]) {
    eval(arguments[1]);
  }
};