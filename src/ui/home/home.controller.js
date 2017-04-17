var messenger = require('./../../common/messenger');
var supportedFormats = require('./../../common/supported-formats');
var ioproxy = require('./../../common/ioproxy');

function HomeController($rootScope, $scope, $window) {
  var $ctrl = this, file, formatter;
  $ctrl.testCase = {};

  $ctrl.$onInit = function () {
    $ctrl.dirty = false;

    checkRecordingStatus();

    // ioproxy.about().then(function (response) {
    //   alert(response.version);
    // });

    messenger.bind({
      recordingToggled: checkRecordingStatus
    });

    if ($window.localStorage.lastPath) {
      $ctrl.read($window.localStorage.lastPath);
    };
  };

  $ctrl.toggleRecording = function () {
    messenger.send({ call: 'toggleRecording' });
  };

  $ctrl.create = function () {
    if ($ctrl.dirty && !confirm("Some changes are not persisted yet, are you sure?")) {
      return;
    }
    $ctrl.testCase = {};
    $ctrl.baseUrl = '/';
    $ctrl.tittle = 'test case';
    $ctrl.testCase.items = [{type:'command'}];
    $ctrl.save(null, true);
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

  $ctrl.run = function () {

    $ctrl.testCase.items.forEach((item) => {
      item.state = undefined;
      item.message = undefined;
    });

    chrome.tabs.sendMessage($window.currentTabId, { call: 'execute', commands: $ctrl.testCase.items, index: 0, count: $ctrl.testCase.items.length });
  };

  $ctrl.onChange = function () {
    $ctrl.dirty = true;
    updateTitle();
  }

  $ctrl.save = function (ev, saveAs) {
    ioproxy.write(!saveAs && file ? file.path : undefined, formatter.stringify($ctrl.testCase), $window.localStorage.lastPath)
      .then((response) => {
        file = response;
        if (response.path) {
          $window.localStorage.lastPath = response.path;
          $ctrl.dirty = false;
          updateTitle();
          $scope.$apply();
        }
      })
      .catch(handleError);
  };

  $ctrl.$onInit();

  function updateTitle() {
    $rootScope.pageTitle = file.path + ($ctrl.dirty ? ' *' : '');
  }

  function processFile(_file) {
    file = _file;
    if (file.path) {
      $window.localStorage.lastPath = file.path;
      updateTitle();
    }
    formatter = supportedFormats.filter((f) => f.test(file.path))[0];
    if (formatter) {
      $ctrl.testCase = formatter.parse(file.data);
      if (!$ctrl.testCase.items.length) {
        $ctrl.testCase.items.push({ type: 'command' });
      }
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