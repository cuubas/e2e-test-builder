var messenger = require('./../../common/messenger');
var supportedFormats = require('./../../common/supported-formats');
var ioproxy = require('./../../common/ioproxy');

function HomeController($rootScope, $scope, $window) {
  var $ctrl = this, file, formatter;

  $ctrl.testCase = {};

  $ctrl.$onInit = function () {
    checkRecordingStatus();

    // ioproxy.about().then(function (response) {
    //   alert(response.version);
    // });

    messenger.bind({
      recordingToggled: checkRecordingStatus
    });

    if ($window.localStorage.lastPath) {
      $rootScope.pageTitle = '';
      $ctrl.read($window.localStorage.lastPath);
    };
  };

  $ctrl.toggleRecording = function () {
    messenger.send({ call: 'toggleRecording' });
  };

  $ctrl.read = function (path) {
    ioproxy.read(path)
      .then(processFile)
      .catch(handleError);
  };

  $ctrl.open = function () {
    ioproxy.open($window.localStorage.lastPath)
      .then(processFile)
      .catch(handleError);
  };

  $ctrl.save = function (ev, saveAs) {
    ioproxy.write(!saveAs && file ? file.path : undefined, formatter.stringify($ctrl.testCase), $window.localStorage.lastPath)
      .then((response) => {
        file = response;
        if (response.path) {
          $rootScope.pageTitle = $window.localStorage.lastPath = response.path;
          $scope.$apply();
        }
      })
      .catch(handleError);
  };

  $ctrl.$onInit();

  function processFile(_file) {
    file = _file;
    if (file.path) {
      $rootScope.pageTitle = $window.localStorage.lastPath = file.path;
    }
    formatter = supportedFormats.filter((f) => f.test(file.path))[0];
    if (formatter) {
      $ctrl.testCase = formatter.parse(file.data);
      $scope.$apply();
    } else {
      throw new Error('unsupported file format');
    }
  };

  function checkRecordingStatus() {
    // get initial state
    messenger.send({ call: 'isRecordingEnabled' }, function (value) {
      $ctrl.isRecordingEnabled = value;
      $scope.$digest();
    });
  }

  function handleError(error) {
    alert(error);
  }

}

module.exports = function (module) {
  module.controller('HomeController', HomeController);
}