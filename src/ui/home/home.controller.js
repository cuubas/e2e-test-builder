var messenger = require('./../../common/messenger');
var supportedFormats = require('./../../common/supported-formats');

function HomeController($rootScope, $scope, $window) {
  var $ctrl = this, file, formatter;

  $ctrl.testCase = {};
  
  $ctrl.$onInit = function () {
    checkRecordingStatus();

    if ($window.localStorage.lastPath) {
      $rootScope.pageTitle = $window.localStorage.lastPath;

      chrome.runtime.sendNativeMessage('com.cuubas.ioproxy',
        { op: "read", path: $window.localStorage.lastPath },
        function (response) {
          if (!handleError(response)) {
            file = response;
            formatter = supportedFormats.filter((f) => f.test(file.path))[0];
            if (formatter) {
              $ctrl.testCase = formatter.parse(response.data);
              $scope.$digest();
            } else {
              alert('unsupported file format');
            }
          } else {
            $window.localStorage.removeItem('lastPath');
          }
        });
    }
  };

  $ctrl.toggleRecording = function () {
    messenger.send({ call: 'toggleRecording' }, checkRecordingStatus);
  }

  $ctrl.open = function () {
    chrome.runtime.sendNativeMessage('com.cuubas.ioproxy',
      { op: "open", lastPath: $window.localStorage.lastPath },
      function (response) {
        if (!handleError(response)) {
          if (response.path) {
            $rootScope.pageTitle = $window.localStorage.lastPath = response.path;
          }
          file = response;
          formatter = supportedFormats.filter((f) => f.test(file.path))[0];
          if (formatter) {
            $ctrl.testCase = formatter.parse(response.data);
            $scope.$apply();
          } else {
            alert('unsupported file format');
          }
        }
      });
  }

  $ctrl.save = function (ev, saveAs) {
    if (!file || saveAs) {
      file = { path: undefined }
    }
    chrome.runtime.sendNativeMessage('com.cuubas.ioproxy',
      { op: "write", path: file.path, data: formatter.stringify($ctrl.testCase), lastPath: $window.localStorage.lastPath },
      function (response) {
        if (!handleError(response)) {
          file = response;
          if (response.path) {
            $rootScope.pageTitle = $window.localStorage.lastPath = response.path;
            $scope.$apply();
          }
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
  $ctrl.$onInit();

}

module.exports = function (module) {
  module.controller('HomeController', HomeController);
}