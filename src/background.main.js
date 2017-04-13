var messenger = require('./common/messenger');

var recordingEnabled = false,
  currentWindowId,
  currentTabId,
  uiWindow,
  api = {
    isRecordingEnabled: function (request, callback) {
      callback(recordingEnabled);
    },
    toggleRecording: function () {
      recordingEnabled = !recordingEnabled;
      chrome.browserAction.setIcon({ path: recordingEnabled ? "assets/icon-recording.png" : "assets/icon.png" });
      // notify active tab
      chrome.tabs.sendMessage(currentTabId, { call: "toggleRecording", value: recordingEnabled });
    }
  };

function handleClick(type, info, tab) {
  if (recordingEnabled) {
    chrome.tabs.sendMessage(tab.id, { call: "transformRightClick", type: type }, function (response) {
      uiWindow.messageHandler(response);
    });
  }
}

function openHelperWindow(_tab) {
  if (!uiWindow || uiWindow.closed) {
    uiWindow = window.open("ui/index.html", "extension_popup", "width=700,height=500,status=no,scrollbars=yes,resizable=no");
    uiWindow.currentTabId = currentTabId;
  }
}

// Create a parent item and two children.
chrome.contextMenus.create({ "title": "Assert Text", contexts: ["all"], onclick: handleClick.bind(this, 'assertText') });

chrome.browserAction.onClicked.addListener(openHelperWindow);

// create link to api
messenger.bind(api);

// track active tab
chrome.tabs.onActivated.addListener(function (activeInfo) {
  uiWindow.currentTabId = currentTabId = activeInfo.tabId;
  currentWindowId = activeInfo.windowId;
  // notify active tab
  chrome.tabs.sendMessage(currentTabId, { call: "toggleRecording", value: recordingEnabled });
});