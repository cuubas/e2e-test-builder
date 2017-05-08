var messenger = require('./common/messenger');
var locators = require('./common/locators');
var elementHelper = require('./common/element-helper');
var runner = require('./common/runner');
var selector = require('./common/selector');
var extensionEval = require('./common/extension-eval');
var uiState = { ready: false };

// load runner extensions
require('./common/runner/key-input');
require('./common/runner/mouse-input');
require('./common/runner/dialogs');
require('./common/runner/commands');
require('./common/runner/accessors');

//content script
var lastEventTarget = null,
  api = {
    recordingEnabled: false,
    toggleRecording: function (request, callback) {
      this.recordingEnabled = request.value;
    },
    highlight: function (request, callback) {
      var element = elementHelper.find(runner.injectVariables(request.locator), document)
      if (element) {
        elementHelper.highlight(element);
        callback(true);
      } else {
        callback(false);
      }
    },
    execute: function (request, callback) {
      runner.options = request.options;
      runner.start(request.commands, request.index, request.count, (index, state, message) => {
        messenger.send({ call: 'commandStateChange', index: index, state: state, message: message });
      });
    },
    interruptRunner: function () {
      runner.stop();
    },
    select: function (request) {
      selector.start(runner.injectVariables(request.locator || ''), (element) => {
        var locators = elementHelper.locators(element, uiState.settings);
        messenger.send({ call: 'elementSelected', locator: locators[0], locators: locators, index: request.index });
      });
    },
    cancelSelect: function () {
      selector.stop();
    },
    handleContextMenuClick: function (request, callback) {
      var value = '';
      if (request.accessor === 'value') {
        value = lastEventTarget.value;
      } else if (request.accessor === 'text') {
        value = lastEventTarget.textContent;
      }
      var locators = elementHelper.locators(lastEventTarget, uiState.settings);
      messenger.send({ call: 'recordCommand', command: request.command, locator: locators[0], locators: locators, value: value });
    },
    supportedCommands: function (request, callback) {
      callback(runner.getSupportedCommands());
    },
    uiWindowOpened: init
  };

// handle recording
document.addEventListener("mousedown", function (event) {
  lastEventTarget = event.target;
  // left click, is recording enabled?
  if (event.button === 0 && api.recordingEnabled) {
    var locators = elementHelper.locators(lastEventTarget, uiState.settings);
    messenger.send({ call: 'recordCommand', command: "click", locator: locators[0], locators: locators });
  }
}, true);

document.addEventListener("blur", function (event) {
  if (api.recordingEnabled && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
    var locators = elementHelper.locators(event.target, uiState.settings);
    messenger.send({ call: 'recordCommand', command: "sendKeys", locator: locators[0], locators: locators, value: event.target.value });
  }
}, true);
// record native alerts
['alert', 'confirm', 'prompt'].forEach((fn) => {
  var orgFn = window[fn];
  window[fn] = function (message) {
    var res = orgFn.apply(this, arguments);
    if (!api.recordingEnabled) {
      return res;
    }
    if (fn === 'confirm' && !res) {
      messenger.send({ call: 'recordCommand', command: 'chooseCancelOnNextConfirmation', locator: '', value: '', indexOffset: -1 });
    } else if (fn === 'prompt') {
      messenger.send({ call: 'recordCommand', command: 'answerOnNextPrompt', locator: '', value: res, indexOffset: -1 });
    }
    if (fn === 'confirm') {
      fn = 'confirmation';
    }
    messenger.send({ call: 'recordCommand', command: "assert" + (fn.substr(0, 1).toUpperCase() + fn.substr(1)), locator: '', value: message });

    return res;
  };
});

// get initial state
messenger.send({ call: 'isRecordingEnabled' }, function (value) {
  api.recordingEnabled = value;
});

messenger.bind(api);
init();

function init() {
  if (uiState.ready) {
    return;
  }
  // get state from ui window initially
  messenger.send({ call: 'uiState' }, (state) => {
    // value will be undefined if ui window is not open
    if (!state) {
      return;
    }
    uiState = state;
    uiState.ready = true;
    // evaluate extension
    // value will be undefined if ui window is not open
    if (state.extensions) {
      // only these properties are available in extension scope (besides browser defaults)
      var context = {
        runner: runner,
        locators: locators,
        settings: state.settings
      };
      state.extensions.forEach((ext) => {
        extensionEval(context, ext.data);
      });
    }
  });
}