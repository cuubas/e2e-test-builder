
export class Messenger {

  public static bind(target: { [index: string]: any }): () => void {
    // create link to target
    chrome.runtime.onMessage.addListener(messageHandler);

    return () => {
      chrome.runtime.onMessage.removeListener(messageHandler);
    }

    function messageHandler(request, sender, sendResponse: (response: any) => void) {
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
        sendResponse(undefined);
      }
    }
  }

  public static send(message: CallAction, callback?: (response: any) => void)
  public static send(message: GetAction, callback?: (response: any) => void)
  public static send(message: SetAction, callback?: (response: any) => void)
  public static send(message: CallAction | GetAction | SetAction, callback?: (response: any) => void) {
    if (typeof callback === 'function') {
      chrome.runtime.sendMessage(chrome.runtime.id, message, {}, callback);
    } else {
      chrome.runtime.sendMessage(chrome.runtime.id, message);
    }
  }
}

export class CallAction {
  public call: string;
  [prop:string]:any; // allow arbitrary properties
}

export class GetAction {
  public get: string;
}

export class SetAction {
  public set: string;
  public value: any;
}