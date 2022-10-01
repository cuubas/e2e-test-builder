import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  NgZone,
  HostListener,
} from "@angular/core";
import { Title } from "@angular/platform-browser";
import { IoProxy, FileResult } from "app/common/ioproxy";
import {
  ConfigObjectStore,
  DBName,
  DBVersion,
  PageTitle,
  PageTitleSeparator,
  SelectedFileKey,
} from "app/ui/config";
import { TestCase, TestCaseItem, SelectionRange } from "app/common/model";
import { Messenger } from "app/common/messenger";
import { BaseFormatter, SupportedFormats } from "app/common/formats";
import { COMMAND_STATE } from "app/common/runner/states";
import {
  Options as RunnerOptions,
  IOptions as IRunnerOptions,
} from "app/common/runner/options";
import { KeyCodes } from "app/common/key-codes";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, OnDestroy {
  public dirty: boolean;
  public running: boolean;
  public isRecordingEnabled: boolean;
  public modals: { settings: Modal; releaseNotes: Modal };
  public testCase: TestCase;
  public supportedCommands: any[] = [];
  public extensions: FileResult[];
  public selection: SelectionRange = new SelectionRange();
  public supportedFormats = SupportedFormats;
  public settings: IRunnerOptions;
  private file: FileResult;
  private formatter: BaseFormatter;
  private promptMessage = "Some changes are not persisted yet, are you sure?";
  private db: IDBDatabase;

  public constructor(
    private titleService: Title,
    private ngZone: NgZone,
    private ioProxy: IoProxy
  ) {
    this.modals = {
      settings: new SettingsModal(this),
      releaseNotes: new ReleaseNotesModal(this),
    };
    // maintain context for select methods
    this.checkRecordingStatus = this.checkRecordingStatus.bind(this);
    this.handleOnBeforeUnload = this.handleOnBeforeUnload.bind(this);
    this.updateSupportedCommands = this.updateSupportedCommands.bind(this);
  }

  public async ngOnInit() {
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
          if (
            this.running &&
            request.index ===
              (this.selection.end - this.selection.start
                ? this.selection.end
                : this.testCase.items.length - 1) && // either execute all or selected range
            (request.state === COMMAND_STATE.DONE ||
              request.state === COMMAND_STATE.FAILED)
          ) {
            this.running = false;
          }
        });
      },
      uiState: (request, callback) => {
        callback({
          settings: this.settings,
          extensions: this.extensions,
        });
      },
      settings: (request, callback) => {
        callback(this.settings);
      },
    });

    window.addEventListener("beforeunload", this.handleOnBeforeUnload);

    window.addEventListener("focus", this.updateSupportedCommands);

    const request = window.indexedDB.open(DBName, DBVersion);
    request.onsuccess = async () => {
      this.db = request.result;
      try {
        await this.getLastUsedFileHandle();
      } catch (err) {
        this.testCase = this.newTestCase();
      }
    };
    request.onerror = (err) => {
      console.error("[IoProxy] can open db", err);
    };
    request.onupgradeneeded = (event) => {
      this.db = (event.target as any).result;
      this.db.createObjectStore(ConfigObjectStore, { keyPath: "id" });
    };

    setTimeout(this.updateSupportedCommands, 1000);
  }

  async reopenLastCase() {
    try {
      const handle = await this.getLastUsedFileHandle();
      await handle.requestPermission({ mode: "readwrite" });
      this.read(handle);
    } catch (err) {
      console.error("[IoProxy] can't read last opened file", err);
      this.testCase = this.newTestCase();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener("beforeunload", this.handleOnBeforeUnload);
  }

  toggleRecording(ev: MouseEvent): void {
    Messenger.send({ call: "toggleRecording" });
  }

  async getLastUsedFileHandle(): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = this.db
        .transaction(ConfigObjectStore, "readonly")
        .objectStore(ConfigObjectStore)
        .get(SelectedFileKey);

      request.onerror = reject;
      request.onsuccess = () => {
        if (request.result && request.result.handle) {
          resolve(request.result.handle);
        } else {
          reject();
        }
      };
    });
  }

  async setLastUsedFileHandle(handle: any): Promise<any> {
    const request = this.db
      .transaction(ConfigObjectStore, "readwrite")
      .objectStore(ConfigObjectStore)
      .add({ id: SelectedFileKey, handle: handle });

    return new Promise((resolve, reject) => {
      request.onerror = reject;
      request.onsuccess = () => {
        resolve(undefined);
      };
    });
  }

  private newTestCase(): TestCase {
    const testCase = new TestCase({
      title: "test case",
      baseUrl: "/",
      items: [new TestCaseItem({ type: "command" } as TestCaseItem)],
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
    this.ioProxy
      .read(path)
      .subscribe(this.processFile.bind(this), this.handleError);
  }

  public open(ev: Event): void {
    this.ioProxy
      .open()
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
    // either execute all starting at selected one or only selected range
    const count =
      this.selection.end === this.selection.start
        ? this.testCase.items.length
        : 1 + this.selection.end - this.selection.start;

    chrome.tabs.sendMessage(window.currentTabId, {
      call: "execute",
      commands: this.testCase.items,
      index: this.selection.start,
      count: count,
      options: this.settings,
    });
  }

  public remove(): void {
    this.testCase.items.splice(
      this.selection.start,
      this.selection.end - this.selection.start + 1
    );
    this.selection.end = this.selection.start;
    this.onChange();
  }

  public interruptRunner(ev: MouseEvent): void {
    chrome.tabs.sendMessage(window.currentTabId, { call: "interruptRunner" });
    this.running = false;
  }

  public onChange(): void {
    this.dirty = true;
    if (this.testCase.items.length === 0) {
      this.testCase.items.push(
        new TestCaseItem({ type: "command" } as TestCaseItem)
      );
    }
    if (this.selection.start >= this.testCase.items.length) {
      this.selection.start = this.testCase.items.length - 1;
    }
    if (this.selection.end >= this.testCase.items.length) {
      this.selection.end = this.testCase.items.length - 1;
    }
    this.updateTitle();
  }

  public save(
    ev: Event,
    saveAs: boolean = false,
    format: BaseFormatter = null
  ) {
    if (format) {
      this.formatter = format;
    }
    if (!this.formatter) {
      this.formatter = this.supportedFormats[0];
    }
    this.reset(); // reset ui state before saving

    this.ioProxy
      .write(
        !saveAs && this.file ? this.file.handle : undefined,
        this.formatter.stringify(this.testCase),
        this.replaceExtension(this.file.path || "", this.formatter.extension)
      )
      .subscribe((response) => {
        this.file = response;
        if (response.path) {
          this.setLastUsedFileHandle(response.handle);
          this.dirty = false;
          this.updateTitle();
        }
      }, this.handleError);
  }

  private updateTitle(): void {
    this.titleService.setTitle(
      PageTitle + PageTitleSeparator + this.file.path + (this.dirty ? " *" : "")
    );
  }

  private processFile(file: FileResult): void {
    this.file = file;
    if (this.file.handle) {
      this.setLastUsedFileHandle(this.file.handle);
      this.updateTitle();
    }
    this.formatter = this.supportedFormats.filter((f: any) =>
      f.test(this.file.path)
    )[0];
    if (this.formatter) {
      this.testCase = this.formatter.parse(this.file.data);
      if (!this.testCase.items.length) {
        this.testCase.items.push(
          new TestCaseItem({ type: "command" } as TestCaseItem)
        );
      }
    } else {
      throw new Error("unsupported file format");
    }
  }

  private checkRecordingStatus(): void {
    // get initial state
    Messenger.send({ call: "isRecordingEnabled" }, (value) => {
      this.ngZone.run(() => {
        this.isRecordingEnabled = value;
      });
    });
  }

  private replaceExtension(path: string, extension: string): string {
    if (!path) {
      path = "test-case.ext";
    }
    return path.replace(/([^/\/])\.(.*)$/, "$1" + extension);
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
    chrome.tabs.sendMessage(
      window.currentTabId,
      { call: "supportedCommands", count: this.supportedCommands.length },
      (list) => {
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
      }
    );
  }

  @HostListener("window:keydown", ["$event"])
  private handleKeyInput(ev: KeyboardEvent) {
    if (ev.ctrlKey && ev.which === KeyCodes.S) {
      ev.preventDefault();
      this.save(ev, ev.shiftKey, this.formatter);
    } else if (ev.ctrlKey && ev.which === KeyCodes.O) {
      ev.preventDefault();
      this.open(ev);
    } else if (ev.ctrlKey && ev.which === KeyCodes.N) {
      ev.preventDefault();
      this.create(ev, this.formatter);
    }
  }
}

export class Modal {
  public visible = false;
  public constructor(protected view: HomeComponent) {}
  public toggle(visible: boolean) {
    this.visible = visible;
  }
}

export class ReleaseNotesModal extends Modal {
  public constructor(view: HomeComponent) {
    super(view);
    this.visible =
      window.localStorage.version !== chrome.runtime.getManifest().version;
  }

  public toggle(visible: boolean) {
    super.toggle(visible);
    if (!visible) {
      window.localStorage.version = chrome.runtime.getManifest().version;
    }
  }
}

export class SettingsModal extends Modal {
  public constructor(view: HomeComponent) {
    super(view);
    this.view.settings = Object.assign(
      {},
      RunnerOptions,
      JSON.parse(window.localStorage.settings || "{}")
    );

    Object.keys(this.view.settings).forEach((key) => {
      if (this.view.settings[key] === "") {
        this.view.settings[key] = RunnerOptions[key];
      }
    });

    this.view.extensions = JSON.parse(window.localStorage.extensions || "[]");
    if (!Array.isArray(this.view.extensions)) {
      this.view.extensions = [];
    }
  }

  public toggle(visible: boolean) {
    super.toggle(visible);
    if (!visible) {
      window.localStorage.settings = JSON.stringify(this.view.settings);
    }
  }
}
