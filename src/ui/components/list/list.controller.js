var messenger = require('./../../../common/messenger');
var elementHelper = require('./../../../common/element-helper');
var colors = {
  good: '#c2f6c8',
  bad: '#ffdede'
};

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
      elementHelper.highlight(ev.target.parentNode, colors[highlighted ? 'good' : 'bad']);
    });
  };

  $ctrl.execute = function (ev, item) {
    chrome.tabs.sendMessage($window.currentTabId, { call: 'execute', command: item.command, locator: item.locator, value: item.value }, function (executed) {
      elementHelper.highlight(ev.target.parentNode, colors[executed ? 'good' : 'bad']);
    });
  };
}

module.exports = function (module) {
  module.controller('ListController', ListController);
}
