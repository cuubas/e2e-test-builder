var messenger = require('./../../../common/messenger');

function ListController($scope, $window) {
  var $ctrl = this;

  $ctrl.$onInit = function () {
    messenger.bind({
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
    chrome.tabs.sendMessage($window.currentTabId, { call: 'highlight', locator: item.locator }, function (highlighted) {
      // highlighted = true|false
    });
  };

  $ctrl.execute = function (ev, item) {
    chrome.tabs.sendMessage($window.currentTabId, { call: 'execute', command: item.command, locator: item.locator, value: item.value }, function (executed) {
      // executed = true|false
    });
  };
}

module.exports = function (module) {
  module.controller('ListController', ListController);
}
