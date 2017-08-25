var pageProxy = require('../common/page-proxy');
var messenger = require('../common/messenger');
var locators = require('../common/locators').SupportedLocators;
var elementHelper = require('../common/element-helper');
var runner = require('../common/runner');
var selector = require('../common/selector');
var extensionEval = require('../common/extension-eval');
var uiState = { ready: false };
var supportedCommands;
// load runner extensions
require('../common/runner/key-input');
require('../common/runner/mouse-input');
require('../common/runner/dialogs');
require('../common/runner/commands');
require('../common/runner/accessors');
require('../common/runner/protractor');

export function run() {
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
        if (!supportedCommands) {
          supportedCommands = runner.getSupportedCommands();
        }
        if (supportedCommands.length === request.count) {
          callback({ noChange: true });
        } else {
          callback(supportedCommands);
        }
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
    // first function is executed in page context and the callback in extension
    pageProxy.run(function (fn, callback) {
      var orgFn = window[fn];
      window[fn] = function (message) {
        var res = orgFn.apply(this, arguments);
        callback(message, res);
        return res;
      };
    }, fn, function (message, res) {
      if (!api.recordingEnabled) {
        return;
      }
      if (fn === 'confirm' && !res) {
        messenger.send({ call: 'recordCommand', command: 'chooseCancelOnNextConfirmation', locator: '', value: '' });
      } else if (fn === 'prompt') {
        messenger.send({ call: 'recordCommand', command: 'answerOnNextPrompt', locator: '', value: res });
      }
      if (fn === 'confirm') {
        fn = 'confirmation';
      }
      messenger.send({ call: 'recordCommand', command: "assert" + (fn.substr(0, 1).toUpperCase() + fn.substr(1)), locator: '', value: message });

    });
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
        // only these properties are available in extension scope
        var context = {
          window: window,
          document: document,
          runner: runner,
          locators: locators,
          settings: state.settings,
          pageProxy: pageProxy
        };
        state.extensions.forEach((ext) => {
          extensionEval(context, ext.data);
        });
      }
    });
  }
}