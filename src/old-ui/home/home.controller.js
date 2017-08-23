var messenger = require('./../../common/messenger');
var supportedFormats = require('./../../common/supported-formats');
var ioproxy = require('./../../common/ioproxy');
var runnerStates = require('../../common/runner-states');
var defaultRunnerOptions = require('../../common/runner-options');

function HomeController($rootScope, $scope, $window) {
  var $ctrl = this, file, formatter, promptMessage = "Some changes are not persisted yet, are you sure?";
  $ctrl.testCase = {};
  $ctrl.supportedCommands = [];
  $ctrl.selectedIndex = 0;
  $ctrl.supportedFormats = supportedFormats;
  $ctrl.settings = Object.assign({}, defaultRunnerOptions, JSON.parse($window.localStorage.settings || '{}'));

  Object.keys($ctrl.settings).forEach((key) => {
    if ($ctrl.settings[key] === '') {
      $ctrl.settings[key] = defaultRunnerOptions[key];
    }
  });
  $ctrl.extensions = JSON.parse($window.localStorage.extensions || '[]');
  if (!Array.isArray($ctrl.extensions)) {
    $ctrl.extensions = [];
  }

  $ctrl.$onInit = function () {
    $ctrl.dirty = false;
    $ctrl.running = false;
    checkRecordingStatus();

    messenger.bind({
      recordingToggled: checkRecordingStatus,
      commandStateChange: function (request, callback) {
        if ($ctrl.running && request.index === $ctrl.testCase.items.length - 1 && (request.state === runnerStates.DONE || request.state === runnerStates.FAILED)) {
          $ctrl.running = false;
          $scope.$digest();
          // digest will be triggerred in list controller
        }
      },
      uiState: function (request, callback) {
        callback({
          settings: $ctrl.settings,
          extensions: $ctrl.extensions
        });
      },
      settings: function (request, callback) {
        callback($ctrl.settings);
      }
    });

    $window.addEventListener('beforeunload', handleOnBeforeUnload);

    $window.addEventListener('focus', updateSupportedCommands);

    if ($window.localStorage.lastPath) {
      $ctrl.read($window.localStorage.lastPath);
    } else {
      $ctrl.testCase = $ctrl.newTestCase();
    }

    setTimeout(updateSupportedCommands, 1000);
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

  $ctrl.create = function (ev, format) {
    if ($ctrl.dirty && !confirm(promptMessage)) {
      return;
    }
    $ctrl.testCase = $ctrl.newTestCase();
    $ctrl.save(null, true, format || $ctrl.supportedFormats[0]);
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
    chrome.tabs.sendMessage($window.currentTabId, { call: 'execute', commands: $ctrl.testCase.items, index: $ctrl.selectedIndex, count: $ctrl.testCase.items.length, options: $ctrl.settings });
  };

  $ctrl.interruptRunner = function () {
    chrome.tabs.sendMessage($window.currentTabId, { call: 'interruptRunner' });
    $ctrl.running = false;
  };

  $ctrl.toggleSettings = function (value) {
    $ctrl.showSettings = value;
    if (!value) {
      $window.localStorage.settings = JSON.stringify($ctrl.settings);
    }
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

  $ctrl.save = function (ev, saveAs, format) {
    if (format) {
      formatter = format;
    }
    if (!formatter) {
      formatter = supportedFormats[0];
    }
    $ctrl.reset(); // reset uii state before saving
    ioproxy.write(!saveAs && file ? file.path : undefined, formatter.stringify($ctrl.testCase), replaceExtension($window.localStorage.lastPath || '', formatter.extension))
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

  function replaceExtension(path, extension) {
    if (!path) {
      path = 'test-case.ext';
    }
    return path.replace(/([^/\/])\.(.*)$/, '$1' + extension);
  }

  function handleError(error) {
    alert(error);
  }

  function handleOnBeforeUnload(ev) {
    if ($ctrl.dirty) {
      ev.returnValue = promptMessage;
    }
  }

  function updateSupportedCommands() {
    if (!$window.currentTabId) {
      return;
    }
    chrome.tabs.sendMessage($window.currentTabId, { call: 'supportedCommands', count: $ctrl.supportedCommands.length }, (list) => {
      if (list && list.noChange) {
        return;
      }
      $ctrl.supportedCommands = list || [];
      $ctrl.supportedCommands.sort((a, b) => {
        if (a.value < b.value) {
          return -1;
        }

        if (a.value > b.value) {
          return 1;
        }

        return 0;
      });

      $scope.$apply();
    });
  };

}

module.exports = function (module) {
  module.controller('HomeController', HomeController);
}