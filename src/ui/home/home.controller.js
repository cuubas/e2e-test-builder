var messenger = require('./../../common/messenger');
var supportedFormats = require('./../../common/supported-formats');
var ioproxy = require('./../../common/ioproxy');
var runnerStates = require('../../common/runner-states');

function HomeController($rootScope, $scope, $window) {
  var $ctrl = this, file, formatter, promptMessage = "Some changes are not persisted yet, are you sure?";
  $ctrl.testCase = {};
  $ctrl.selectedIndex = 0;

  $ctrl.$onInit = function () {
    $ctrl.dirty = false;
    $ctrl.running = false;
    checkRecordingStatus();

    // ioproxy.about().then(function (response) {
    //   alert(response.version);
    // });

    messenger.bind({
      recordingToggled: checkRecordingStatus,
      commandStateChange: function (request, callback) {
        if ($ctrl.running && request.index === $ctrl.testCase.items.length - 1 && (request.state === runnerStates.DONE || request.state === runnerStates.FAILED)) {
          $ctrl.running = false;
          $scope.$digest();
          // digest will be triggerred in list controller
        }
      }
    });

    $window.addEventListener('beforeunload', handleOnBeforeUnload);

    if ($window.localStorage.lastPath) {
      $ctrl.read($window.localStorage.lastPath);
    } else {
      $ctrl.testCase = $ctrl.newTestCase();
    }
  };

  $ctrl.$onDestroy = function () {
    $window.removeEventListener('beforeunload', handleOnBeforeUnload);
  };

  $ctrl.toggleRecording = function () {
    messenger.send({ call: 'toggleRecording' });
  };

  $ctrl.newTestCase = function () {
    var res = {};
    res.baseUrl = '/';
    res.title = 'test case';
    res.items = [{ type: 'command' }];
    return res;
  }

  $ctrl.create = function () {
    if ($ctrl.dirty && !confirm(promptMessage)) {
      return;
    }
    $ctrl.testCase = $ctrl.newTestCase();
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

  $ctrl.reset = function () {
    $ctrl.testCase.items.forEach((item) => {
      item.state = undefined;
      item.message = undefined;
    });
  };

  $ctrl.run = function () {
    $ctrl.reset();
    $ctrl.running = true;
    chrome.tabs.sendMessage($window.currentTabId, { call: 'execute', commands: $ctrl.testCase.items, index: $ctrl.selectedIndex, count: $ctrl.testCase.items.length });
  };

  $ctrl.interruptRunner = function () {
    chrome.tabs.sendMessage($window.currentTabId, { call: 'interruptRunner' });
    $ctrl.running = false;
  };

  $ctrl.onChange = function () {
    $ctrl.dirty = true;
    if ($ctrl.testCase.items.length === 0) {
      $ctrl.testCase.items.push({ type: 'command' });
    }
    if ($ctrl.selectedIndex >= $ctrl.testCase.items.length) {
      $ctrl.selectedIndex = $ctrl.testCase.items.length - 1;
    }
    updateTitle();
  };

  $ctrl.onSelect = function (index) {
    $ctrl.selectedIndex = index;
  };

  $ctrl.save = function (ev, saveAs) {
    if (!formatter) {
      formatter = supportedFormats[0];
    }
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

  function handleOnBeforeUnload(ev) {
    if ($ctrl.dirty) {
      ev.returnValue = promptMessage;
    }
  }

}

module.exports = function (module) {
  module.controller('HomeController', HomeController);
}