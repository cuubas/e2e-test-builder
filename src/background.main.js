var messenger = require('./common/messenger');

var recordingEnabled = false,
  currentTabId,
  uiWindow,
  skipNextTabActivationEvent = false,
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

function handleContextMenuClick(command, accessor, info, tab) {
  chrome.tabs.sendMessage(tab.id, { call: "handleContextMenuClick", command: command, accessor: accessor });
}

function openUiWindow(_tab) {
  currentTabId = _tab.id;
  if (!uiWindow || uiWindow.closed) {
    skipNextTabActivationEvent = true;
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

  chrome.tabs.sendMessage(currentTabId, { call: "uiWindowOpened" });
}

// expose api
window.$registerUiWindow = registerUiWindow;

var contentContexts = ["page", "frame", "selection", "link", "editable", "image", "video", "audio"];
var contentUris = ["http://*/*", "https://*/*", "file://*/*"];
// Create a parent item and two children.
recordingContextMenuItemId = chrome.contextMenus.create({ "title": "Record interactions", type: 'checkbox', checked: false, enabled: false, contexts: ["all"], onclick: api.toggleRecording.bind(api) });
chrome.contextMenus.create({ type: 'separator', contexts: contentContexts, documentUrlPatterns: contentUris });

chrome.contextMenus.create({ "title": "Click", contexts: contentContexts, documentUrlPatterns: contentUris, onclick: handleContextMenuClick.bind(this, 'click', undefined) });
// first item is the command prefix, 2nd is the prefix visible to the user
[['assert', 'Assert'], ['waitFor', 'Wait for'], ['store', 'Store']].forEach((accessor) => {
  chrome.contextMenus.create({ type: 'separator', contexts: contentContexts, documentUrlPatterns: contentUris });
  // first item is the command suffix, 2nd is the suffix visible to the user
  [['Text', 'Text'], ['Value', 'Value'], ['Visible', 'Visible'], ['ElementPresent', 'Element Present']].forEach((cmd) => {
    chrome.contextMenus.create({ "title": accessor[1] + " " + cmd[1], contexts: contentContexts, documentUrlPatterns: contentUris, onclick: handleContextMenuClick.bind(this, accessor[0] + cmd[0], cmd[0].substring(0, 1).toLowerCase() + cmd[0].substring(1)) });
  });
});
chrome.browserAction.onClicked.addListener(openUiWindow);

// create link to api
messenger.bind(api);

// track active tab
chrome.tabs.onActivated.addListener(function (activeInfo) {
  if (skipNextTabActivationEvent) {
    skipNextTabActivationEvent = false;
    return;
  }
  currentTabId = activeInfo.tabId;
  if (uiWindow) {
    uiWindow.currentTabId = currentTabId;
  }
  // notify active tab
  chrome.tabs.sendMessage(currentTabId, { call: "toggleRecording", value: recordingEnabled });
});