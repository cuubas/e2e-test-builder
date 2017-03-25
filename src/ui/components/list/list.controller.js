var messenger = require('./../../../common/messenger');

function ListController($http, $scope, $window) {
  var $ctrl = this;
  $ctrl.commands = [];
  $ctrl.$onInit = function () {
    $window.messageHandler = messenger.bind({
      trackClick: function (request, callback) {
        $ctrl.commands.push(request);
        $scope.$digest();
      },
      trackInput: function (request, callback) {
        $ctrl.commands.push(request);
        $scope.$digest();
      },
      assert: function (request, callback) {
        $ctrl.commands.push(request);
        $scope.$digest();
      }      
    }, true);

    checkRecordingStatus();
  };
  $ctrl.click = function () {
    messenger.send({ call: 'toggleRecording' }, checkRecordingStatus);
  }

  function checkRecordingStatus() {
    // get initial state
    messenger.send({ call: 'isRecordingEnabled' }, function (value) {
      $ctrl.isRecordingEnabled = value;
      $scope.$digest();
    });
  }
}

module.exports = function (module) {
  module.controller('ListController', ListController);
}