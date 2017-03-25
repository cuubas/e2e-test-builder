var messenger = require('./../../common/messenger');

function HomeController($scope) {
  var $ctrl = this;
  this.commands = [];
  checkRecordingStatus();
  
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
  module.controller('HomeController', HomeController);
}