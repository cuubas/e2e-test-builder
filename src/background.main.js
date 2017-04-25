var messenger = require('./common/messenger');

var recordingEnabled = false,
  currentWindowId,
  currentTabId,
  uiWindow,
  uiWindowSettings = JSON.parse(window.localStorage.uiWindowSettings || '{}'),
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

function handleContextMenuClick(command, info, tab) {
  chrome.tabs.sendMessage(tab.id, { call: "handleContextMenuClick", command: command });
}

function openUiWindow(_tab) {
  if (!uiWindow || uiWindow.closed) {
    var props = "width=" + (uiWindowSettings.width || 700) + ",height=" + (uiWindowSettings.height || 500) + ",status=no,scrollbars=yes,resizable=no";
    if (uiWindowSettings.x) {
      props += ',left=' + uiWindowSettings.x;
    }
    if (uiWindowSettings.y) {
      props += ',top=' + uiWindowSettings.y;
    }
    uiWindow = window.open("ui/index.html", "extension_popup", props);
    chrome.contextMenus.update(recordingContextMenuItemId, { enabled: true });
  } else {
    uiWindow.focus();
  }
}

function registerUiWindow(wnd) {
  uiWindow = wnd;
  uiWindow.currentTabId = currentTabId;

  // can't record without ui window
  uiWindow.addEventListener('beforeunload', function () {
    // remember ui window settings
    uiWindowSettings.width = uiWindow.outerWidth;
    uiWindowSettings.height = uiWindow.outerHeight;
    uiWindowSettings.x = uiWindow.screenLeft;
    uiWindowSettings.y = uiWindow.screenTop;

    window.localStorage.uiWindowSettings = JSON.stringify(uiWindowSettings);

    uiWindow = undefined;
    recordingEnabled = true;
    api.toggleRecording();
  });
}

// expose api
window.$registerUiWindow = registerUiWindow;

// Create a parent item and two children.
recordingContextMenuItemId = chrome.contextMenus.create({ "title": "Record interactions", type: 'checkbox', checked: false, enabled: false, contexts: ["all"], onclick: api.toggleRecording.bind(api) });
chrome.contextMenus.create({ type: 'separator' });

chrome.contextMenus.create({ "title": "Assert Text", contexts: ["all"], onclick: handleContextMenuClick.bind(this, 'assertText') });

chrome.browserAction.onClicked.addListener(openUiWindow);

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