var messenger = require('./../../../common/messenger');
var elementHelper = require('./../../../common/element-helper');
var runner = require('../../../common/runner');
var positiveColor = '#c2f6c8';
var negativeColor = '#ffd3d3';

function ListController($scope, $window) {
  var $ctrl = this;
  $ctrl.STATES = require('../../../common/runner-states');

  $ctrl.$onInit = function () {
    messenger.bind({
      recordCommand: function (request, callback) {
        $ctrl.items.push({ command: request.command, locator: request.locator, value: request.value, type: 'command' });
        $ctrl.onChange();
        $scope.$digest();
      },
      commandStateChange: function (request, callback) {
        $ctrl.items[request.index].state = request.state;
        if (request.message) {
          $ctrl.items[request.index].message = request.message;
        }
        $scope.$digest();
      },
    });

  };

  $ctrl.highlight = function (ev, item) {
    chrome.tabs.sendMessage($window.currentTabId, { call: 'highlight', locator: item.locator }, function (highlighted) {
      elementHelper.highlight(ev.target.parentNode, highlighted ? positiveColor : negativeColor);
    });
  };

  $ctrl.execute = function (ev, item) {
    item.message = undefined;
    item.state = undefined;
    chrome.tabs.sendMessage($window.currentTabId, { call: 'execute', commands: $ctrl.items, index: $ctrl.items.indexOf(item), count: 1 });
  };

  $ctrl.onSort = function (indexFrom, indexTo) {
    $ctrl.onChange();
  };

  $ctrl.add = function (type) {
    $ctrl.items.push({ type: type });
  }
}

module.exports = function (module) {
  module.controller('ListController', ListController);
}
