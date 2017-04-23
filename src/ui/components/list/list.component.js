module.exports = function (module) {
  var ListComponent = {
    bindings: {
      recording: '<',
      items: '<',
      selectedIndex: '<',
      onSelect: '&',
      onChange: '&'
    },
    template: require('./list.partial.html'),
    controller: 'ListController'
  };

  require('./list.controller')(module);

  module.component('list', ListComponent);
}