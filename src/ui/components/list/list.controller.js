var messenger = require('./../../../common/messenger');
var elementHelper = require('./../../../common/element-helper');
var positiveColor = '#c2f6c8';
var negativeColor = '#ffdede';

function ListController($scope, $window) {
  var $ctrl = this;

  $ctrl.$onInit = function () {
    messenger.bind({
      recordCommand: function (request, callback) {
        $ctrl.items.push({ command: request.command, locator: request.locator, value: request.value, type: 'command' });
        $scope.$digest();
      }
    });

  };

  $ctrl.highlight = function (ev, item) {
    chrome.tabs.sendMessage($window.currentTabId, { call: 'highlight', locator: item.locator }, function (highlighted) {
      elementHelper.highlight(ev.target.parentNode, highlighted ? positiveColor : negativeColor);
    });
  };

  $ctrl.execute = function (ev, item) {
    chrome.tabs.sendMessage($window.currentTabId, { call: 'execute', commands: [item] }, function (executed) {
      elementHelper.highlight(ev.target.parentNode, executed ? positiveColor : negativeColor);
    });
  };
}

module.exports = function (module) {
  module.controller('ListController', ListController);
}
