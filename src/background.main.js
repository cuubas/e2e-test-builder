var messenger = require('./common/messenger');

var recordingEnabled = false,
  currentWindowId,
  currentTabId,
  uiWindow,
  recordingContextMenuItemId,
  api = {
    isRecordingEnabled: function (request, callback) {
      callback(recordingEnabled);
    },
    toggleRecording: function () {
      recordingEnabled = !recordingEnabled;
      chrome.browserAction.setIcon({ path: recordingEnabled ? "assets/icon-recording.png" : "assets/icon.png" });
      // notify self and anyone who is listening
      messenger.send({ call: 'recordingToggled', value: recordingEnabled });

      chrome.tabs.sendMessage(currentTabId, { call: "toggleRecording", value: recordingEnabled });

      chrome.contextMenus.update(recordingContextMenuItemId, { checked: recordingEnabled });
    }
  };

function handleContextMenuClick(type, info, tab) {
    chrome.tabs.sendMessage(tab.id, { call: "handleContextMenuClick", type: type });
}

function openHelperWindow(_tab) {
  if (!uiWindow || uiWindow.closed) {
    uiWindow = window.open("ui/index.html", "extension_popup", "width=700,height=500,status=no,scrollbars=yes,resizable=no");
    uiWindow.currentTabId = currentTabId;
    chrome.contextMenus.update(recordingContextMenuItemId, { enabled: true });

    // can't record without ui window
    uiWindow.addEventListener('beforeunload', function () {
      uiWindow = undefined;
      recordingEnabled = true;
      api.toggleRecording();
    });
  }
}

// Create a parent item and two children.
recordingContextMenuItemId = chrome.contextMenus.create({ "title": "Record interactions", type: 'checkbox', checked: false, enabled: false, contexts: ["all"], onclick: api.toggleRecording.bind(api) });
chrome.contextMenus.create({ type: 'separator' });

chrome.contextMenus.create({ "title": "Assert Text", contexts: ["all"], onclick: handleContextMenuClick.bind(this, 'assertText') });

chrome.browserAction.onClicked.addListener(openHelperWindow);

// create link to api
messenger.bind(api);

// track active tab
chrome.tabs.onActivated.addListener(function (activeInfo) {
  currentTabId = activeInfo.tabId;
  currentWindowId = activeInfo.windowId;
  if (uiWindow) {
    uiWindow.currentTabId = currentTabId;
  }
  // notify active tab
  chrome.tabs.sendMessage(currentTabId, { call: "toggleRecording", value: recordingEnabled });
});