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
/***/ function(module, exports) {

	var recordingEnabled = false,
	  api = {
	    trackClick: function (request, callback) {
	      console.info(request);
	    },
	    trackInput: function (request, callback) {
	      console.info(request);
	    },
	    isRecordingEnabled: function (request, callback) {
	      callback(recordingEnabled);
	    }
	  };

	function handleClick(info, tab) {
	  chrome.tabs.sendMessage(tab.id, { call: "getRightClickTarget" }, function (className) {
	    console.info("right click on:" + className);
	  });
	}

	function toggleRecording(tab) {
	  recordingEnabled = !recordingEnabled;
	  chrome.browserAction.setIcon({ path: recordingEnabled ? "assets/icon-recording.png" : "assets/icon.png" });
	  chrome.tabs.sendMessage(tab.id, { call: "toggleRecording", value: recordingEnabled });
	}

	// Create a parent item and two children.
	chrome.contextMenus.create({ "title": "Assert Element", contexts: ["all"], onclick: handleClick });

	chrome.browserAction.onClicked.addListener(toggleRecording);

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

/***/ }
/******/ ]);