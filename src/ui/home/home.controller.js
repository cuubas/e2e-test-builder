var messenger = require('./../../common/messenger');

function HomeController($scope, $window) {
  var $ctrl = this;
  this.commands = [];
  checkRecordingStatus();

  $ctrl.toggleRecording = function () {
    messenger.send({ call: 'toggleRecording' }, checkRecordingStatus);
  }

  $ctrl.open = function () {
    chrome.runtime.sendNativeMessage('com.cuubas.ioproxy',
      { op: "open", path: $window.localStorage.lastPath },
      function (response) {
        var error = response && response.error || chrome.runtime.lastError
        if (error) {
          alert(JSON.stringify(error));
          return;
        }

        $window.localStorage.lastPath = response.path;
        console.log(response);
      });
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