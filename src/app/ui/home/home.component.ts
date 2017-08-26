import { Component, OnInit, OnDestroy, ViewEncapsulation, NgZone } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { IoProxy, FileResult } from 'app/common/ioproxy';
import { PageTitle, PageTitleSeparator } from 'app/ui/config';
import { TestCase, TestCaseItem } from 'app/common/model';
import { Messenger } from 'app/common/messenger';
import { BaseFormatter, SupportedFormats } from 'app/common/formats';
import { COMMAND_STATE } from 'app/common/runner/states';
import { Options as RunnerOptions, IOptions as IRunnerOptions } from 'app/common/runner/options';

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
  public testCase: TestCase;
  public supportedCommands: any[] = [];
  public extensions: FileResult[];
  public selectedIndex = 0;
  public supportedFormats = SupportedFormats;
  public settings: IRunnerOptions;
  private file: FileResult;
  private formatter: BaseFormatter;
  private promptMessage = 'Some changes are not persisted yet, are you sure?';

  public constructor(
    private titleService: Title,
    private ngZone: NgZone,
    private ioProxy: IoProxy
  ) {
    this.settings = Object.assign({}, RunnerOptions, JSON.parse(window.localStorage.settings || '{}'));

    Object.keys(this.settings).forEach((key) => {
      if (this.settings[key] === '') {
        this.settings[key] = RunnerOptions[key];
      }
    });

    this.extensions = JSON.parse(window.localStorage.extensions || '[]');
    if (!Array.isArray(this.extensions)) {
      this.extensions = [];
    }
    this.testCase = new TestCase();
    // maintain context for select methods
    this.checkRecordingStatus = this.checkRecordingStatus.bind(this);
    this.handleOnBeforeUnload = this.handleOnBeforeUnload.bind(this);
    this.updateSupportedCommands = this.updateSupportedCommands.bind(this);
  }

  public ngOnInit() {

    this.dirty = false;
    this.running = false;
    this.checkRecordingStatus();

    Messenger.bind({
      recordingToggled: (request) => {
        this.ngZone.run(() => {
          this.isRecordingEnabled = request.value;
        });
      },
      commandStateChange: (request, callback) => {
        this.ngZone.run(() => {
          if (this.running
            && request.index === this.testCase.items.length - 1
            && (request.state === COMMAND_STATE.DONE || request.state === COMMAND_STATE.FAILED)) {
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

  public toggleRecording(ev: MouseEvent): void {
    Messenger.send({ call: 'toggleRecording' });
  }

  private newTestCase(): TestCase {
    const testCase = new TestCase({
      title: 'test case',
      baseUrl: '/',
      items: [{ type: 'command' } as TestCaseItem]
    });
    return testCase;
  }

  public create(ev: Event, format: BaseFormatter): void {
    if (this.dirty && !confirm(this.promptMessage)) {
      return;
    }
    this.testCase = this.newTestCase();
    this.save(null, true, format || this.supportedFormats[0]);
  }

  public read(path: string): void {
    this.ioProxy.read(path)
      .subscribe(this.processFile.bind(this), this.handleError);
  }

  public open(ev: MouseEvent): void {
    this.ioProxy.open(window.localStorage.lastPath)
      .subscribe(this.processFile.bind(this), this.handleError);
  }

  public reset(): void {
    this.testCase.items.forEach((item) => {
      item.state = undefined;
      item.message = undefined;
    });
  }

  public run(ev: MouseEvent): void {
    this.reset();
    this.running = true;

    chrome.tabs.sendMessage(window.currentTabId, {
      call: 'execute',
      commands: this.testCase.items,
      index: this.selectedIndex,
      count: this.testCase.items.length,
      options: this.settings
    });
  }

  public interruptRunner(ev: MouseEvent): void {
    chrome.tabs.sendMessage(window.currentTabId, { call: 'interruptRunner' });
    this.running = false;
  }

  public toggleSettings(value: boolean): void {
    this.showSettings = value;
    if (!value) {
      window.localStorage.settings = JSON.stringify(this.settings);
    }
  }

  public onChange(): void {
    this.dirty = true;
    if (this.testCase.items.length === 0) {
      this.testCase.items.push({ type: 'command' } as TestCaseItem);
    }
    if (this.selectedIndex >= this.testCase.items.length) {
      this.selectedIndex = this.testCase.items.length - 1;
    }
    this.updateTitle();
  }

  public onSelect(index): void {
    this.selectedIndex = index;
  }

  public save(ev: Event, saveAs: boolean = false, format: BaseFormatter = null) {
    if (format) {
      this.formatter = format;
    }
    if (!this.formatter) {
      this.formatter = this.supportedFormats[0];
    }
    this.reset(); // reset ui state before saving

    this.ioProxy.write(!saveAs && this.file ? this.file.path : undefined,
      this.formatter.stringify(this.testCase),
      this.replaceExtension(window.localStorage.lastPath || '',
        this.formatter.extension))
      .subscribe((response) => {
        this.file = response;
        if (response.path) {
          window.localStorage.lastPath = response.path;
          this.dirty = false;
          this.updateTitle();
        }
      }, this.handleError);
  }

  private updateTitle(): void {
    this.titleService.setTitle(PageTitle + PageTitleSeparator + this.file.path + (this.dirty ? ' *' : ''));
  }

  private processFile(file: FileResult): void {
    this.file = file;
    if (this.file.path) {
      window.localStorage.lastPath = this.file.path;
      this.updateTitle();
    }
    this.formatter = this.supportedFormats.filter((f: any) => f.test(this.file.path))[0];
    if (this.formatter) {
      this.testCase = this.formatter.parse(this.file.data);
      if (!this.testCase.items.length) {
        this.testCase.items.push({ type: 'command' } as TestCaseItem);
      }
    } else {
      throw new Error('unsupported file format');
    }
  }

  private checkRecordingStatus(): void {
    // get initial state
    Messenger.send({ call: 'isRecordingEnabled' }, (value) => {
      this.ngZone.run(() => {
        this.isRecordingEnabled = value;
      });
    });
  }

  private replaceExtension(path: string, extension: string): string {
    if (!path) {
      path = 'test-case.ext';
    }
    return path.replace(/([^/\/])\.(.*)$/, '$1' + extension);
  }

  private handleError(error): void {
    alert(error);
  }

  private handleOnBeforeUnload(ev): void {
    if (this.dirty) {
      ev.returnValue = this.promptMessage;
    }
  }

  private updateSupportedCommands(): void {
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
  }
}
