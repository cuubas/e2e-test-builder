var messenger = require('./../../../common/messenger');

function ListController($scope, $window) {
  var $ctrl = this;

  $ctrl.$onInit = function () {
    $window.messageHandler = messenger.bind({
      trackClick: function (request, callback) {
        $ctrl.commands.push({ type: 'click', locator: request.locator, value: request.value });
        $scope.$digest();
      },
      trackInput: function (request, callback) {
        $ctrl.commands.push({ type: 'sendKeys', locator: request.locator, value: request.value });
        $scope.$digest();
      },
      assertText: function (request, callback) {
        $ctrl.commands.push({ type: 'assertText', locator: request.locator, value: request.value });
        $scope.$digest();
      }
    }, true);

  };

}

module.exports = function (module) {
  module.controller('ListController', ListController);
}
