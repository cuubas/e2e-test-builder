var messenger = require('./../../../common/messenger');
var elementHelper = require('./../../../common/element-helper');
var positiveColor = '#c2f6c8';
var negativeColor = '#ffd3d3';

function ListController($scope, $window, $element) {
  var $ctrl = this;
  $ctrl.STATES = require('../../../common/runner-states');

  $ctrl.$onInit = function () {
    messenger.bind({
      recordCommand: function (request, callback) {
        $scope.$apply(() => {
          var indexOffset = request.indexOffset || 0;
          $ctrl.items.splice($ctrl.selectedIndex + 1 + indexOffset, 0, { command: request.command, locator: request.locator, value: request.value, type: 'command' });
          $ctrl.notifySelect($ctrl.selectedIndex + 1);
          $ctrl.onChange();
        });
      },
      commandStateChange: function (request, callback) {
        $scope.$apply(() => {
          $ctrl.items[request.index].state = request.state;
          if (request.message) {
            $ctrl.items[request.index].message = request.message;
          }
        });
      },
      elementSelected: function (request) {
        $scope.$apply(() => {
          $ctrl.items[request.index].locator = request.locator;
        });
      }
    });

  };

  $ctrl.notifySelect = function (index) {
    $ctrl.onSelect({ index: index });
  };

  $ctrl.highlight = function (ev, item) {
    chrome.tabs.sendMessage($window.currentTabId, { call: 'highlight', locator: item.locator }, function (highlighted) {
      elementHelper.highlight(ev.target.parentNode, highlighted ? positiveColor : negativeColor);
    });
  };

  $ctrl.execute = function (ev, item) {
    item.message = undefined;
    item.state = undefined;
    chrome.tabs.sendMessage($window.currentTabId, { call: 'execute', commands: $ctrl.items, index: $ctrl.items.indexOf(item), count: 1, options: $ctrl.settings });
  };

  $ctrl.selectElement = function (ev, item) {
    if (item.selecting) {
      delete item.selecting;
      chrome.tabs.sendMessage($window.currentTabId, { call: 'cancelSelect' });
      return;
    }
    $ctrl.items.forEach(function (item) {
      delete item.selecting;
    });
    item.selecting = true;
    chrome.tabs.sendMessage($window.currentTabId, { call: 'select', locator: item.locator, index: $ctrl.items.indexOf(item) });
  };

  $ctrl.onSort = function (indexFrom, indexTo) {
    $ctrl.notifySelect(indexTo);
    $ctrl.onChange();
  };

  $ctrl.add = function (type, index) {
    $ctrl.items.splice(index, 0, { type: type });

    // give new input field focus
    $scope.$$postDigest(() => {
      $element[0].querySelector('.item-wrapper:nth-child(' + (index + 1) + ') .focus input').focus();
    });
  };

  $ctrl.remove = function (ev, item) {
    $ctrl.items.splice($ctrl.items.indexOf(item), 1);
    $ctrl.onChange();
  };
}

module.exports = function (module) {
  module.controller('ListController', ListController);
}
