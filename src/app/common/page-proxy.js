
// usage 
/*
var cleanup = pageProxy.run(function(<optional args>, callback) {
  callback(42); // complete page context is available here
}, <optional args>, function callback (input) {
  // input == 42
  cleanup(); // call cleanup when callback will no longer be called
});

// or

var proxy = pageProxy.create(function(<optional args>, callback) {
  callback(42); // complete page context is available here
});

proxy.run(<optional args>, function callback (input) {
  // input == 42
  proxy.dispose(); // call cleanup when callback will no longer be called
});

*/
module.exports = {
  run: run,
  create: create
};

var handlers = {};
var counter = 0;

function create(fn) {
  var msgId = 'handler-' + (++counter);
  return {
    run: function (callback) {
      handlers[msgId] = arguments[arguments.length - 1];
      var params = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
      window.postMessage({ code: fn.toString(), params: params, id: msgId, target: 'page' }, window.location.href);
    },
    dispose: dispose.bind(msgId)
  };
}

function dispose(id) {
  if (handlers[id]) {
    delete handlers[id];
  }
}

function run(fn, callback) {
  if (typeof (fn) !== 'function') {
    throw new Error('type error, 1st argument must be a functon');
  }
  var msgId = 'handler-' + (++counter);
  handlers[msgId] = arguments[arguments.length - 1];
  var params = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
  window.postMessage({ code: fn.toString(), params: params, id: msgId, target: 'page' }, window.location.href);

  return function () {
    dispose(msgId);
  }
}

window.addEventListener('message', function (ev) {
  if (window.location.origin === ev.origin && ev.data.target === 'extension') {
    var handler = handlers[ev.data.id];
    if (handler) {
      handler.apply(undefined, ev.data.params);
    } else {
      console.warn('no handler for ' + ev.data.id)
    }
  }
});

var loader = document.createElement('script');
// code below runs in page context
loader.textContent = '(' + function () {
  window.addEventListener('message', function (ev) {
    if (window.location.origin === ev.origin && ev.data.target === 'page') {
      var context = {
        params: ev.data.params || []
      };
      context.params.push(function () {
        window.postMessage({ params: Array.prototype.slice.call(arguments, 0), target: 'extension', id: ev.data.id }, window.location.href);
      });
      eval('with(context){var module = undefined;(' + ev.data.code + ').apply(this, params);}');
    }
  });
} + ')()';
(document.head || document.documentElement).appendChild(loader);