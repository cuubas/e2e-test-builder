var messenger = require('./common/messenger');
var locators = require('./common/locators');
var elementHelper = require('./common/element-helper');
var locator = locators.css;
var runner = require('./common/runner');
var selector = require('./common/selector');

// load runner extensions
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
      var element = elementHelper.find(request.locator, document)
      if (element) {
        elementHelper.highlight(element);
        callback(true);
      } else {
        callback(false);
      }
    },
    execute: function (request, callback) {
      runner.start(request.commands, request.index, request.count, (index, state, message) => {
        messenger.send({ call: 'commandStateChange', index: index, state: state, message: message });
      });
    },
    interruptRunner: function () {
      runner.stop();
    },
    select: function (request) {
      selector.start(request.locator, (element) => {
        messenger.send({ call: 'elementSelected', locator: locator(element), index: request.index });
      });
    },
    cancelSelect: function () {
      selector.stop();
    },
    handleContextMenuClick: function (request, callback) {
      if (request.command === 'assertText') {
        messenger.send({ call: 'recordCommand', command: request.command, locator: locator(lastEventTarget), value: lastEventTarget.textContent });
      }
    }
  };

document.addEventListener("mousedown", function (event) {
  lastEventTarget = event.target;
  // left click, is recording enabled?
  if (event.button === 0 && api.recordingEnabled) {
    messenger.send({ call: 'recordCommand', command: "click", locator: locator(lastEventTarget) });
  }
}, true);

document.addEventListener("blur", function (event) {
  if (api.recordingEnabled && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
    messenger.send({ call: 'recordCommand', command: "sendKeys", locator: locator(event.target), value: event.target.value });
  }
}, true);

// get initial state
messenger.send({ call: 'isRecordingEnabled' }, function (value) {
  api.recordingEnabled = value;
});

messenger.bind(api);
