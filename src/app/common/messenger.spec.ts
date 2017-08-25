import { Messenger } from './messenger';

describe('messenger', () => {
  let messageHandler;

  beforeEach(() => {
    chrome.runtime = {} as any;
    chrome.runtime.id = '123456';
    chrome.runtime.onMessage = {} as any;
    chrome.runtime.onMessage.addListener = jasmine.createSpy('onMessage.addListener').and.callFake((handler) => { messageHandler = handler; });
    chrome.runtime.onMessage.removeListener = jasmine.createSpy('onMessage.removeListener').and.stub();
    chrome.runtime.sendMessage = jasmine.createSpy('sendMessage').and.stub();
  });

  describe('bind', () => {
    let target;
    beforeEach(() => {
      var theAnswer = 42;
      target = {
        foo: 1,
        baz: 2,
        status: (request, callback) => {
          callback(theAnswer);
        }
      };
      Messenger.bind(target);
    });
    it('should add listener', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    it('should get value from target', (done) => {
      messageHandler({ get: 'foo' }, null, (value) => {
        expect(value).toBe(target.foo);
        done();
      });
    });

    it('should set value on target', (done) => {
      messageHandler({ set: 'baz', value: 3 }, null, (value) => {
        expect(target.baz).toBe(3);
        done();
      });
    });

    it('should set non existing value on target', (done) => {
      messageHandler({ set: 'baz2', value: 4 }, null, (value) => {
        expect(target.baz2).toBe(4);
        done();
      });
    });

    it('should invoke function on target', (done) => {
      messageHandler({ call: 'status' }, null, (value) => {
        expect(value).toBe(42);
        done();
      });
    });

    it('should remove listener', () => {
      let cleanup = Messenger.bind({});
      cleanup();
      expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalled();
    });

  });

  describe('send', () => {
    it('should work with callback', () => {
      Messenger.send({ call: 'foo' }, () => { });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith('123456', { call: 'foo' }, {}, jasmine.any(Function));
    });

    it('should work without callback', () => {
      Messenger.send({ call: 'foo' });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith('123456', { call: 'foo' });
    });
  });
});