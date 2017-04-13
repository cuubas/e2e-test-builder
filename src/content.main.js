var messenger = require('./common/messenger');
var locators = require('./common/locators');
var elementHelper = require('./common/element-helper');
var locator = locators.css;

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
      var element = elementHelper.find(request.locator, document);
      if (element && request.command === 'click') {
        element.click();
        callback(true);
      } else {
        callback(false);
      }
    },
    transformRightClick: function (request, callback) {
      if (request.type === 'assertText') {
        callback({ call: request.type, locator: locator(lastEventTarget), value: lastEventTarget.textContent });
      }
    }
  };

document.addEventListener("mousedown", function (event) {
  lastEventTarget = event.target;
  // left click, is recording enabled?
  if (event.button === 0 && api.recordingEnabled) {
    messenger.send({ call: "trackClick", locator: locator(lastEventTarget) });
  }
}, true);

document.addEventListener("blur", function (event) {
  if (api.recordingEnabled && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
    messenger.send({ call: "trackInput", locator: locator(event.target), value: event.target.value });
  }
}, true);

// get initial state
messenger.send({ call: 'isRecordingEnabled' }, function (value) {
  api.recordingEnabled = value;
});

messenger.bind(api);
