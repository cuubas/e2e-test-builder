
// usage
/*
var cleanup = PageProxy.run(function(<optional args>, callback) {
  callback(42); // complete page context is available here
}, <optional args>, function callback (input) {
  // input == 42
  cleanup(); // call cleanup when callback will no longer be called
});

// or

var proxy = new PageProxy(function(<optional args>, callback) {
  callback(42); // complete page context is available here
});

proxy.run(<optional args>, function callback (input) {
  // input == 42
  proxy.dispose(); // call cleanup when callback will no longer be called
});

*/

export class PageProxy {
  public static handlers = {};
  public static counter = 0;

  private messageId;

  public static run(fn, ...args) {
    if (typeof (fn) !== 'function') {
      throw new Error('type error, 1st argument must be a functon');
    }
    const msgId = 'handler-' + (++PageProxy.counter);
    PageProxy.handlers[msgId] = arguments[arguments.length - 1];
    const params = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
    window.postMessage({ code: fn.toString(), params: params, id: msgId, target: 'page' }, window.location.href);

    return function () {
      if (PageProxy.handlers[this.messageId]) {
        delete PageProxy.handlers[this.messageId];
      }
    };
  }

  public static init() {
    window.addEventListener('message', function (ev) {
      if (window.location.origin === ev.origin && ev.data.target === 'extension') {
        const handler = PageProxy.handlers[ev.data.id];
        if (handler) {
          handler.apply(undefined, ev.data.params);
        } else {
          console.warn('no handler for ' + ev.data.id);
        }
      }
    });

    const loader = document.createElement('script');
    // code below runs in page context
    loader.textContent = '(' + function () {
      window.addEventListener('message', function (ev) {
        if (window.location.origin === ev.origin && ev.data.target === 'page') {
          const context = {
            params: ev.data.params || []
          };
          context.params.push(function () {
            window.postMessage({
              params: Array.prototype.slice.call(arguments, 0),
              target: 'extension',
              id: ev.data.id
            }, window.location.href);
          });
          // tslint:disable-next-line:no-eval
          eval('with(context){var module = undefined;(' + ev.data.code + ').apply(this, params);}');
        }
      });
    } + ')()';
    (document.head || document.documentElement).appendChild(loader);
  }

  public constructor(
    private handler: (() => void) | string
  ) {
    this.messageId = 'handler-' + (++PageProxy.counter);
  }

  public run(...args): void {
    PageProxy.handlers[this.messageId] = args[args.length - 1];
    const params = Array.prototype.slice.call(args, 0, args.length - 1);
    window.postMessage({ code: this.handler.toString(), params: params, id: this.messageId, target: 'page' }, window.location.href);
  }

  public dispose(): void {
    if (PageProxy.handlers[this.messageId]) {
      delete PageProxy.handlers[this.messageId];
    }
  }
}
