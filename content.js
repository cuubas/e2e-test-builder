//content script
var lastEventTarget = null,
  extensionId = 'cfeikbgmncemnmkfghlbbnamgjajgdkb',
  api = {
    recordingEnabled: false,
    toggleRecording: function (request, callback) {
      this.recordingEnabled = request.value;
    },
    getRightClickTarget: function (request, callback) {
      callback(lastEventTarget.className);
    },
    sendMessage: function (message, callback) {
      if (typeof callback === 'function') {
        chrome.runtime.sendMessage(extensionId, message, {}, callback);
      } else {
        chrome.runtime.sendMessage(extensionId, message);
      }
    },
    alert: function (request, callback) {
      alert(request.value);
    }
  };

document.addEventListener("mousedown", function (event) {
  lastEventTarget = event.target;
  // left click, is recording enabled?
  if (event.button === 0 && api.recordingEnabled) {
    api.sendMessage({ call: "trackClick", target: lastEventTarget.className });
  }
}, true);

document.addEventListener("blur", function (event) {
  if (api.recordingEnabled && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
    api.sendMessage({ call: "trackInput", target: event.target.className, value: event.target.value });
  }
}, true);
// get initial state
api.sendMessage({ call: 'isRecordingEnabled' }, function (value) {
  api.recordingEnabled = value;
});
// create link to api
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (!request) {
    return;
  }
  if (request.call && typeof (api[request.call]) === 'function') {
    api[request.call].call(api, request, sendResponse);
  } else if (request.get && typeof (api[request.get]) !== 'function') {
    sendResponse(api[request.get]);
  } else if (request.set && typeof (api[request.set]) !== 'function') {
    api[request.set] = request.value;
  }
});