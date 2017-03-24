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

	//content script
	var lastEventTarget = null,
	  extensionId = 'hbpilpdepompcfkejfpnmpnjdeldcogd',
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

/***/ }
/******/ ]);