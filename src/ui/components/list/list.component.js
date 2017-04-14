module.exports = function (module) {
  var ListComponent = {
    bindings: {
      recording: '<',
      items: '<',
      onChange: '&'
    },
    template: require('./list.partial.html'),
    controller: 'ListController',
    controllerAs: 'ctrl'
  };

  require('./list.controller')(module);

  module.component('list', ListComponent);
}