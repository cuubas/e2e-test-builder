module.exports = {
  bind: bind,
  send: send
};
var extensionId = chrome.runtime.id;
function bind(target, returnOnly) {
  // create link to target
  chrome.runtime.onMessage.addListener(messageHandler);
  
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