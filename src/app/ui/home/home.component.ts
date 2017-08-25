import { Component, OnInit, OnDestroy, ViewEncapsulation, NgZone } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { IoProxy, FileResult } from 'app/common/ioproxy';
import { PageTitle, PageTitleSeparator } from 'app/ui/config';
import * as messenger from './../../common/messenger';
import * as supportedFormats from './../../common/supported-formats';
import * as runnerStates from '../../common/runner-states';
import * as defaultRunnerOptions from '../../common/runner-options';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, OnDestroy {

  public dirty: boolean;
  public running: boolean;
  public isRecordingEnabled: boolean;
  public showSettings: boolean;
  public testCase = { items: [] };
  public supportedCommands: any[] = [];
  public extensions: any[];
  public selectedIndex = 0;
  public supportedFormats;
  public settings;
  private file: FileResult;
  private formatter;
  private promptMessage = 'Some changes are not persisted yet, are you sure?'

  public constructor(
    private titleService: Title,
    private ngZone: NgZone,
    private ioProxy: IoProxy
  ) {
    this.supportedFormats = supportedFormats;
    this.settings = Object.assign({}, defaultRunnerOptions, JSON.parse(window.localStorage.settings || '{}'));

    Object.keys(this.settings).forEach((key) => {
      if (this.settings[key] === '') {
        this.settings[key] = defaultRunnerOptions[key];
      }
    });

    this.extensions = JSON.parse(window.localStorage.extensions || '[]');
    if (!Array.isArray(this.extensions)) {
      this.extensions = [];
    }

    // maintain context for select methods
    this.checkRecordingStatus = this.checkRecordingStatus.bind(this);
    this.handleOnBeforeUnload = this.handleOnBeforeUnload.bind(this);
    this.updateSupportedCommands = this.updateSupportedCommands.bind(this);
  }

  public ngOnInit() {

    this.dirty = false;
    this.running = false;
    this.checkRecordingStatus();

    messenger.bind({
      recordingToggled: this.checkRecordingStatus,
      commandStateChange: (request, callback) => {
        this.ngZone.run(() => {
          if (this.running && request.index === this.testCase.items.length - 1 && (request.state === runnerStates.DONE || request.state === runnerStates.FAILED)) {
            this.running = false;
          }
        });
      },
      uiState: (request, callback) => {
        callback({
          settings: this.settings,
          extensions: this.extensions
        });
      },
      settings: (request, callback) => {
        callback(this.settings);
      }
    });

    window.addEventListener('beforeunload', this.handleOnBeforeUnload);

    window.addEventListener('focus', this.updateSupportedCommands);

    if (window.localStorage.lastPath) {
      this.read(window.localStorage.lastPath);
    } else {
      this.testCase = this.newTestCase();
    }

    setTimeout(this.updateSupportedCommands, 1000);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.handleOnBeforeUnload);
  }

  toggleRecording(): void {
    messenger.send({ call: 'toggleRecording' });
  };

  newTestCase() {
    var res = {} as any;
    res.baseUrl = '/';
    res.title = 'test case';
    res.items = [{ type: 'command' }];
    return res;
  }

  create(ev, format) {
    if (this.dirty && !confirm(this.promptMessage)) {
      return;
    }
    this.testCase = this.newTestCase();
    this.save(null, true, format || this.supportedFormats[0]);
  };

  read(path) {
    this.ioProxy.read(path)
      .subscribe(this.processFile.bind(this), this.handleError);
  };

  open() {
    this.ioProxy.open(window.localStorage.lastPath)
      .subscribe(this.processFile.bind(this), this.handleError);
  };

  reset() {
    this.testCase.items.forEach((item) => {
      item.state = undefined;
      item.message = undefined;
    });
  };

  run() {
    this.reset();
    this.running = true;
    chrome.tabs.sendMessage(window.currentTabId, { call: 'execute', commands: this.testCase.items, index: this.selectedIndex, count: this.testCase.items.length, options: this.settings });
  };

  interruptRunner() {
    chrome.tabs.sendMessage(window.currentTabId, { call: 'interruptRunner' });
    this.running = false;
  };

  toggleSettings(value) {
    this.showSettings = value;
    if (!value) {
      window.localStorage.settings = JSON.stringify(this.settings);
    }
  };

  onChange() {
    this.dirty = true;
    if (this.testCase.items.length === 0) {
      this.testCase.items.push({ type: 'command' });
    }
    if (this.selectedIndex >= this.testCase.items.length) {
      this.selectedIndex = this.testCase.items.length - 1;
    }
    this.updateTitle();
  };

  onSelect(index) {
    this.selectedIndex = index;
  };

  save(ev, saveAs, format) {
    if (format) {
      this.formatter = format;
    }
    if (!this.formatter) {
      this.formatter = supportedFormats[0];
    }
    this.reset(); // reset uii state before saving
    this.ioProxy.write(!saveAs && this.file ? this.file.path : undefined, this.formatter.stringify(this.testCase), this.replaceExtension(window.localStorage.lastPath || '', this.formatter.extension))
      .subscribe((response) => {
        this.file = response;
        if (response.path) {
          window.localStorage.lastPath = response.path;
          this.dirty = false;
          this.updateTitle();
        }
      }, this.handleError);
  };

  updateTitle() {
    this.titleService.setTitle(PageTitle + PageTitleSeparator + this.file.path + (this.dirty ? ' *' : ''));
  }

  processFile(_file: FileResult) {
    this.file = _file;
    if (this.file.path) {
      window.localStorage.lastPath = this.file.path;
      this.updateTitle();
    }
    this.formatter = supportedFormats.filter((f: any) => f.test(this.file.path))[0];
    if (this.formatter) {
      this.testCase = this.formatter.parse(this.file.data);
      if (!this.testCase.items.length) {
        this.testCase.items.push({ type: 'command' });
      }
    } else {
      throw new Error('unsupported file format');
    }
  };

  checkRecordingStatus() {
    // get initial state
    messenger.send({ call: 'isRecordingEnabled' }, (value) => {
      this.ngZone.run(() => {
        this.isRecordingEnabled = value;
      });
    });
  }

  replaceExtension(path, extension) {
    if (!path) {
      path = 'test-case.ext';
    }
    return path.replace(/([^/\/])\.(.*)$/, '$1' + extension);
  }

  handleError(error) {
    alert(error);
  }

  handleOnBeforeUnload(ev) {
    if (this.dirty) {
      ev.returnValue = this.promptMessage;
    }
  }

  updateSupportedCommands() {
    if (!window.currentTabId) {
      return;
    }
    chrome.tabs.sendMessage(window.currentTabId, { call: 'supportedCommands', count: this.supportedCommands.length }, (list) => {
      if (list && list.noChange) {
        return;
      }
      this.ngZone.run(() => {
        this.supportedCommands = list || [];
        this.supportedCommands.sort((a, b) => {
          if (a.value < b.value) {
            return -1;
          }

          if (a.value > b.value) {
            return 1;
          }

          return 0;
        });
      });
    });
  };
}