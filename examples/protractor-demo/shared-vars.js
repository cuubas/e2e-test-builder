// add this file as an extension and below 
var config = {
  url: 'http://juliemr.github.io/protractor-demo/'
};

if (typeof runner === 'object') {
  runner.listeners.onStart.push(function () {
    runner.exposeObjectAsVariables(config, 'config');
  });
} else {
  module.exports = config;
}