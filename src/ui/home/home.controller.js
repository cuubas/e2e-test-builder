var messenger = require('./../../common/messenger');

function HomeController($scope, $window) {
  var $ctrl = this,
    file;
  this.commands = [];
  checkRecordingStatus();

  $ctrl.toggleRecording = function () {
    messenger.send({ call: 'toggleRecording' }, checkRecordingStatus);
  }

  $ctrl.open = function () {
    chrome.runtime.sendNativeMessage('com.cuubas.ioproxy',
      { op: "open", lastPath: $window.localStorage.lastPath },
      function (response) {
        if (!handleError(response)) {
          if (response.path) {
            $ctrl.path = $window.localStorage.lastPath = response.path;
          }
          file = response;
          $scope.$digest();
        }
      });
  }

  $ctrl.save = function (ev, saveAs) {
    if (!file || saveAs) {
      file = { data: file && file.data || "hello world" };
    }
    chrome.runtime.sendNativeMessage('com.cuubas.ioproxy',
      { op: "write", path: file.path, data: file.data, lastPath: $window.localStorage.lastPath },
      function (response) {
        if (!handleError(response)) {
          console.log(response);
        }
      });
  }

  function checkRecordingStatus() {
    // get initial state
    messenger.send({ call: 'isRecordingEnabled' }, function (value) {
      $ctrl.isRecordingEnabled = value;
      $scope.$digest();
    });
  }

  function handleError(response) {
    var error = response && response.code < 1 ? response : chrome.runtime.lastError
    if (error) {
      alert(error.message || "an error occured");
      return true;
    }
    return false;
  }

}

module.exports = function (module) {
  module.controller('HomeController', HomeController);
}