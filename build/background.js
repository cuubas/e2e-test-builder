/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var messenger = __webpack_require__(1);

	var recordingEnabled = false,
	  uiWindow,
	  tab,
	  api = {
	    isRecordingEnabled: function (request, callback) {
	      callback(recordingEnabled);
	    },
	    toggleRecording: function () {
	      recordingEnabled = !recordingEnabled;
	      chrome.browserAction.setIcon({ path: recordingEnabled ? "assets/icon-recording.png" : "assets/icon.png" });
	      chrome.tabs.sendMessage(tab.id, { call: "toggleRecording", value: recordingEnabled });
	    }
	  };

	function handleClick(info, tab) {
	  if (recordingEnabled) {
	    chrome.tabs.sendMessage(tab.id, { call: "getRightClickTarget" }, function (className) {
	      uiWindow.messageHandler({ call: 'assert', target: className });
	    });
	  }
	}

	function openHelperWindow(_tab) {
	  tab = _tab;
	  if (!uiWindow || uiWindow.closed) {
	    uiWindow = window.open("ui/index.html", "extension_popup", "width=500,height=500,status=no,scrollbars=yes,resizable=no");
	  }
	}

	// Create a parent item and two children.
	chrome.contextMenus.create({ "title": "Assert Element", contexts: ["all"], onclick: handleClick });

	chrome.browserAction.onClicked.addListener(openHelperWindow);

	// create link to api
	messenger.bind(api);

	// proxy all messages to the helper window as well
	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	  if (uiWindow && !request.$called) {
	    return uiWindow.messageHandler(request, sender, sendResponse);
	  }
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = {
	  bind: bind,
	  send: send
	};
	var extensionId = chrome.runtime.id;
	function bind(target, returnOnly) {
	  // create link to target
	  if (!returnOnly) {
	    chrome.runtime.onMessage.addListener(messageHandler);
	  }
	  return messageHandler;

	  function messageHandler(request, sender, sendResponse) {
	    if (!request) {
	      return;
	    }
	    if (request.call && typeof (target[request.call]) === 'function') {
	      target[request.call].call(target, request, sendResponse);
	      request.$called = true;
	    } else if (request.get && typeof (target[request.get]) !== 'function') {
	      sendResponse(target[request.get]);
	    } else if (request.set && typeof (target[request.set]) !== 'function') {
	      target[request.set] = request.value;
	    }
	  }
	}

	function send(message, callback) {
	  if (typeof callback === 'function') {
	    chrome.runtime.sendMessage(extensionId, message, {}, callback);
	  } else {
	    chrome.runtime.sendMessage(extensionId, message);
	  }
	}

/***/ }
/******/ ]);