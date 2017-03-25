module.exports = function (module) {
  var ListComponent = {
    bindings: {
      recording: '<',
      commands: '<'
    },
    template: require('./list.partial.html'),
    controller: 'ListController'
  };

  require('./list.controller')(module);

  module.component('list', ListComponent);
}