import { Injectable } from '@angular/core';
import { Messenger } from '../common/messenger';

@Injectable()
export class BackgroundService {
  private recordingContextMenuItemId: number;
  private isRecordingEnabled: boolean;
  private currentTabId: number;
  private uiWindow: Window;
  private skipNextTabActivationEvent: boolean = false;
  private uiWindowSettings: UiWindowSettings;
  private api;

  constructor() {
    this.registerUiWindow = this.registerUiWindow.bind(this);
    this.openUiWindow = this.openUiWindow.bind(this);
  }

  public init(): void {
    this.uiWindowSettings = JSON.parse(window.localStorage.uiWindowSettings || '{}');
    // create and link api
    this.api = this.createAPI();
    Messenger.bind(this.api);

    this.createContextMenu();
    this.initActiveTabTracking();
    // expose api so that helper window could register itself
    window.$registerUiWindow = this.registerUiWindow.bind(this);

    chrome.browserAction.onClicked.addListener(this.openUiWindow);
  }

  private initActiveTabTracking() {
    // track active tab
    chrome.tabs.onActivated.addListener((activeInfo) => {
      if (this.skipNextTabActivationEvent) {
        this.skipNextTabActivationEvent = false;
        return;
      }
      this.currentTabId = activeInfo.tabId;
      if (this.uiWindow) {
        this.uiWindow.currentTabId = this.currentTabId;
      }
      // notify active tab
      chrome.tabs.sendMessage(this.currentTabId, { call: "toggleRecording", value: this.isRecordingEnabled });
    });
  }

  private createContextMenu() {
    var contentContexts = ["page", "frame", "selection", "link", "editable", "image", "video", "audio"];
    var contentUris = ["http://*/*", "https://*/*", "file://*/*"];
    // Create a parent item and two children.
    this.recordingContextMenuItemId = <any>chrome.contextMenus.create({ "title": "Record interactions", type: 'checkbox', checked: false, enabled: false, contexts: ["all"], onclick: this.api.toggleRecording.bind(this.api) });
    chrome.contextMenus.create({ type: 'separator', contexts: contentContexts, documentUrlPatterns: contentUris });

    chrome.contextMenus.create({ "title": "Click", contexts: contentContexts, documentUrlPatterns: contentUris, onclick: this.handleContextMenuClick.bind(this, 'click', undefined) });
    // first item is the command prefix, 2nd is the prefix visible to the user
    [['assert', 'Assert'], ['waitFor', 'Wait for'], ['store', 'Store']].forEach((accessor) => {
      chrome.contextMenus.create({ type: 'separator', contexts: contentContexts, documentUrlPatterns: contentUris });
      // first item is the command suffix, 2nd is the suffix visible to the user
      [['Text', 'Text'], ['Value', 'Value'], ['Visible', 'Visible'], ['ElementPresent', 'Element Present']].forEach((cmd) => {
        chrome.contextMenus.create({ "title": accessor[1] + " " + cmd[1], contexts: contentContexts, documentUrlPatterns: contentUris, onclick: this.handleContextMenuClick.bind(this, accessor[0] + cmd[0], cmd[0].substring(0, 1).toLowerCase() + cmd[0].substring(1)) });
      });
    });

  }

  private createAPI() {
    return {
      isRecordingEnabled: (request, callback) => {
        callback(this.isRecordingEnabled);
      },
      toggleRecording: () => {
        this.isRecordingEnabled = !this.isRecordingEnabled;
        chrome.browserAction.setIcon({ path: this.isRecordingEnabled ? "assets/icon-c@32.png" : "assets/icon-c@32.png" });
        // notify self and anyone who is listening
        Messenger.send({ call: 'recordingToggled', value: this.isRecordingEnabled });

        chrome.tabs.sendMessage(this.currentTabId, { call: "toggleRecording", value: this.isRecordingEnabled });

        chrome.contextMenus.update(this.recordingContextMenuItemId, { checked: this.isRecordingEnabled });
      }
    };
  }

  public handleContextMenuClick(command, accessor, info, tab) {
    chrome.tabs.sendMessage(tab.id, { call: "handleContextMenuClick", command: command, accessor: accessor });
  }

  public openUiWindow(_tab) {
    this.currentTabId = _tab.id;
    if (!this.uiWindow || this.uiWindow.closed) {
      this.skipNextTabActivationEvent = true;
      var props = "width=" + (this.uiWindowSettings.width || 700) + ",height=" + (this.uiWindowSettings.height || 500) + ",status=no,scrollbars=yes,resizable=no";
      if (this.uiWindowSettings.x) {
        props += ',left=' + this.uiWindowSettings.x;
      }
      if (this.uiWindowSettings.y) {
        props += ',top=' + this.uiWindowSettings.y;
      }
      this.uiWindow = window.open("ui/index.html", "extension_popup", props);
      chrome.contextMenus.update(this.recordingContextMenuItemId, { enabled: true });
    } else {
      this.uiWindow.focus();
    }
  }

  public registerUiWindow(wnd) {
    this.uiWindow = wnd;
    this.uiWindow.currentTabId = this.currentTabId;

    // can't record without ui window
    this.uiWindow.addEventListener('beforeunload', () => {
      // remember ui window settings
      this.uiWindowSettings.width = this.uiWindow.outerWidth;
      this.uiWindowSettings.height = this.uiWindow.outerHeight;
      this.uiWindowSettings.x = this.uiWindow.screenLeft;
      this.uiWindowSettings.y = this.uiWindow.screenTop;

      window.localStorage.uiWindowSettings = JSON.stringify(this.uiWindowSettings);

      this.uiWindow = undefined;
      this.isRecordingEnabled = true;
      this.api.toggleRecording();
    });

    chrome.tabs.sendMessage(this.currentTabId, { call: "uiWindowOpened" });
  }

}

export interface UiWindowSettings {
  width: number;
  height: number;
  x: number;
  y: number;
}