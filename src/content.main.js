var messenger = require('./common/messenger');

//content script
var lastEventTarget = null,
  api = {
    recordingEnabled: false,
    toggleRecording: function (request, callback) {
      this.recordingEnabled = request.value;
    },
    getRightClickTarget: function (request, callback) {
      callback(lastEventTarget.className);
    },
    alert: function (request, callback) {
      alert(request.value);
    }
  };

document.addEventListener("mousedown", function (event) {
  lastEventTarget = event.target;
  // left click, is recording enabled?
  if (event.button === 0 && api.recordingEnabled) {
    messenger.send({ call: "trackClick", target: lastEventTarget.className });
  }
}, true);

document.addEventListener("blur", function (event) {
  if (api.recordingEnabled && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
    messenger.send({ call: "trackInput", target: event.target.className, value: event.target.value });
  }
}, true);
// get initial state
messenger.send({ call: 'isRecordingEnabled' }, function (value) {
  api.recordingEnabled = value;
});

messenger.bind(api);
