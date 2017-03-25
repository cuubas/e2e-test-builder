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