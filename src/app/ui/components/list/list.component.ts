import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, ElementRef, NgZone } from '@angular/core';
import { highlight } from 'app/common/element-helper';
import { COMMAND_STATE } from 'app/common/runner/states';
import { Messenger } from 'app/common/messenger';

const positiveColor = '#c2f6c8';
const negativeColor = '#ffd3d3';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListComponent implements OnInit {
  @Input() public items: any[];
  @Input() public selectedIndex: number;
  @Input() public recording: boolean;
  @Input() public settings: any;
  @Output() onChange = new EventEmitter();
  @Output() onSelect = new EventEmitter();

  public STATES = COMMAND_STATE;
  constructor(
    private element: ElementRef,
    private ngZone: NgZone
  ) {
  }

  ngOnInit() {
    Messenger.bind({
      recordCommand: (request, callback) => {
        this.ngZone.run(() => {
          var indexOffset = request.indexOffset || 0;
          this.items.splice(this.selectedIndex + 1 + indexOffset, 0, { command: request.command, locator: request.locator, value: request.value, type: 'command' });
          this.notifySelect(this.selectedIndex + 1);
          this.onChange.emit();
        });
      },
      commandStateChange: (request, callback) => {
        this.ngZone.run(() => {
          this.items[request.index].state = request.state;
          if (request.message) {
            this.items[request.index].message = request.message;
          }
        });
      },
      elementSelected: (request) => {
        this.ngZone.run(() => {
          this.items[request.index].locator = request.locator;
        });
      }
    });

  };

  public notifySelect(index) {
    this.onSelect.emit({ index: index });
  };

  public highlight(ev, item) {
    chrome.tabs.sendMessage(window.currentTabId, { call: 'highlight', locator: item.locator }, function (highlighted) {
      highlight(ev.target.parentNode, highlighted ? positiveColor : negativeColor);
    });
  };

  public execute(ev, item) {
    ev.target.blur();
    item.message = undefined;
    item.state = undefined;
    chrome.tabs.sendMessage(window.currentTabId, { call: 'execute', commands: this.items, index: this.items.indexOf(item), count: 1, options: this.settings });
  };

  public selectElement(ev, item) {
    if (item.selecting) {
      delete item.selecting;
      chrome.tabs.sendMessage(window.currentTabId, { call: 'cancelSelect' });
      return;
    }
    this.items.forEach(function (item) {
      delete item.selecting;
    });
    item.selecting = true;
    chrome.tabs.sendMessage(window.currentTabId, { call: 'select', locator: item.locator, index: this.items.indexOf(item) });
  };

  public onSort(indexFrom, indexTo) {
    this.notifySelect(indexTo);
    this.onChange.emit();
  };

  public add(type, index) {
    this.items.splice(index, 0, { type: type });

    // give new input field focus
    this.element.nativeElement.querySelector('.item-wrapper:nth-child(' + (index + 1) + ') .focus input').focus();
  };

  public remove(ev, item) {
    this.items.splice(this.items.indexOf(item), 1);
    this.onChange.emit();
  };

  public trackByIndex(index: number, obj: any): any {
    return index;
  }
}
