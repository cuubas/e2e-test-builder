import { Injectable, Inject } from '@angular/core';

import { PageProxy } from 'app/common/page-proxy';
import { Messenger } from 'app/common/messenger';
import { SupportedLocators } from 'app/common/locators';
import { find, findLocators, highlight } from 'app/common/element-helper';
import { runner, SupportedCommand } from 'app/common/runner';
import { IOptions, Options } from 'app/common/runner/options';
import { Selector } from 'app/common/selector';
import { safeEval } from 'app/common/safe-eval';

// load runner extensions
import 'app/common/runner/key-input';
import 'app/common/runner/mouse-input';
import 'app/common/runner/dialogs';
import 'app/common/runner/commands';
import 'app/common/runner/accessors';
import 'app/common/runner/protractor';

@Injectable()
export class ContentService {
  private uiState: { ready: boolean, settings: IOptions } = { ready: false, settings: Options };
  private supportedCommands: SupportedCommand[];
  private lastEventTarget: HTMLElement;
  private api;
  private selector: Selector;

  constructor() {
    this.initUiState = this.initUiState.bind(this);
  }

  public init(): void {
    this.api = this.createAPI();

    // init page proxy (will add another script and setup messaging)
    PageProxy.init();

    // record native alerts
    this.initPrompts();

    // handle recording
    this.initRecording();

    // get initial state
    Messenger.send({ call: 'isRecordingEnabled' }, (value) => {
      this.api.recordingEnabled = value;
    });

    // expose methods for background page and ui window to interact with content script
    Messenger.bind(this.api);

    // request initial ui state (settings and extension)
    this.initUiState();
  }

  public createAPI() {
    return {
      recordingEnabled: false,
      toggleRecording: (request, callback) => {
        this.api.recordingEnabled = request.value;
      },
      highlight: (request, callback) => {
        const element = find(runner.injectVariables(request.locator), document);
        if (element) {
          highlight(element);
          callback(true);
        } else {
          callback(false);
        }
      },
      execute: (request, callback) => {
        runner.options = request.options;
        runner.start(request.commands, request.index, request.count, (index, state, message) => {
          Messenger.send({ call: 'commandStateChange', index: index, state: state, message: message });
        });
      },
      interruptRunner: () => {
        runner.stop();
      },
      select: (request) => {
        this.selector = new Selector(runner.injectVariables(request.locator || ''), (element) => {
          const matchingLocators = findLocators(element, this.uiState.settings);
          Messenger.send({ call: 'elementSelected', locator: matchingLocators[0], locators: matchingLocators, index: request.index });
        });
        this.selector.start();
      },
      cancelSelect: () => {
        this.selector.stop();
        this.selector = null;
      },
      handleContextMenuClick: (request, callback) => {
        let value = '';
        if (request.accessor === 'value') {
          value = (<any>this.lastEventTarget).value;
        } else if (request.accessor === 'text') {
          value = this.lastEventTarget.textContent;
        }
        const matchingLocators = findLocators(this.lastEventTarget as HTMLElement, this.uiState.settings);
        Messenger.send({
          call: 'recordCommand',
          command: request.command,
          locator: matchingLocators[0],
          locators: matchingLocators,
          value: (value || '').trim()
        });
      },
      supportedCommands: (request, callback) => {
        if (!this.supportedCommands) {
          this.supportedCommands = runner.getSupportedCommands();
        }
        if (this.supportedCommands.length === request.count) {
          callback({ noChange: true });
        } else {
          callback(this.supportedCommands);
        }
      },
      uiWindowOpened: this.initUiState
    };
  }

  public initUiState() {
    if (this.uiState.ready) {
      return;
    }
    // get state from ui window initially
    Messenger.send({ call: 'uiState' }, (state) => {
      // value will be undefined if ui window is not open
      if (!state) {
        return;
      }
      this.uiState = state;
      this.uiState.ready = true;
      // evaluate extension
      // value will be undefined if ui window is not open
      if (state.extensions) {
        // only these properties are available in extension scope
        const context = {
          window: window,
          document: document,
          runner: runner,
          locators: SupportedLocators,
          settings: state.settings,
          PageProxy: PageProxy
        };

        state.extensions.forEach(function (ext) {
          safeEval(context, ext.data);
        });
      }
    });
  }

  public initRecording() {

    document.addEventListener('mousedown', (event: MouseEvent) => {
      this.lastEventTarget = event.target as HTMLElement;
      // left click, is recording enabled?
      if (event.button === 0 && this.api.recordingEnabled) {
        const matchingLocators = findLocators(this.lastEventTarget, this.uiState.settings);
        Messenger.send({ call: 'recordCommand', command: 'click', locator: matchingLocators[0], locators: matchingLocators });
      }
    }, true);

    document.addEventListener('blur', (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (this.api.recordingEnabled && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA')) {
        const matchingLocators = findLocators(input, this.uiState.settings);
        Messenger.send({ call: 'recordCommand', command: 'sendKeys', locator: matchingLocators[0], locators: matchingLocators, value: input.value });
      }
    }, true);
  }

  public initPrompts() {
    ['alert', 'confirm', 'prompt'].forEach((promptType) => {
      // first function is executed in page context and the callback in extension
      PageProxy.run((fn, callback) => {
        const orgFn = (window as any)[fn] as Function;
        (window as any)[fn] = function (message) {
          const res = orgFn.apply(this, arguments);
          callback(message, res);
          return res;
        };
      }, promptType, (message, res) => {
        if (!this.api.recordingEnabled) {
          return;
        }
        if (promptType === 'confirm' && !res) {
          Messenger.send({
            call: 'recordCommand',
            command: 'chooseCancelOnNextConfirmation',
            locator: '', value: ''
          });
        } else if (promptType === 'prompt') {
          Messenger.send({
            call: 'recordCommand',
            command: 'answerOnNextPrompt',
            locator: '',
            value: res
          });
        }
        if (promptType === 'confirm') {
          promptType = 'confirmation';
        }
        Messenger.send({
          call: 'recordCommand',
          command: 'assert' + (promptType.substr(0, 1).toUpperCase() + promptType.substr(1)),
          locator: '', value: message
        });

      });
    });
  }
}
