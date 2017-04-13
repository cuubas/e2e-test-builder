var messenger = require('./../../../common/messenger');

function ListController($scope, $window) {
  var $ctrl = this;

  $ctrl.$onInit = function () {
    $window.messageHandler = messenger.bind({
      trackClick: function (request, callback) {
        $ctrl.items.push({ command: 'click', locator: request.locator, value: request.value, type: 'command' });
        $scope.$digest();
      },
      trackInput: function (request, callback) {
        $ctrl.items.push({ command: 'sendKeys', locator: request.locator, value: request.value, type: 'command' });
        $scope.$digest();
      },
      assertText: function (request, callback) {
        $ctrl.items.push({ command: 'assertText', locator: request.locator, value: request.value, type: 'command' });
        $scope.$digest();
      }
    }, true);

  };

  $ctrl.highlight = function (ev, item) {
    messenger.send({ call: 'dispatch', action: 'highlight', locator: item.locator });
  }
}

module.exports = function (module) {
  module.controller('ListController', ListController);
}
