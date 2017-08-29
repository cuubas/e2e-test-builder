import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, ElementRef, NgZone } from '@angular/core';
import { highlight } from 'app/common/element-helper';
import { COMMAND_STATE } from 'app/common/runner/states';
import { Messenger } from 'app/common/messenger';
import { TestCaseItem, SelectionRange } from 'app/common/model';
import { IOptions } from 'app/common/runner/options';
import { PositiveColor, NegativeColor } from 'app/ui/config';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListComponent implements OnInit {
  @Input() public items: TestCaseItem[];
  @Input() public selection: SelectionRange;
  @Input() public recording: boolean;
  @Input() public settings: IOptions;
  @Output() onChange = new EventEmitter();

  public STATES = COMMAND_STATE;
  public dragState: DragState = new DragState();

  constructor(
    private element: ElementRef,
    private ngZone: NgZone
  ) {
  }

  ngOnInit() {
    Messenger.bind({
      recordCommand: (request, callback) => {

        this.ngZone.run(() => {
          const indexOffset = request.indexOffset || 0;
          this.items.splice(this.selection.end + 1 + indexOffset, 0, {
            command: request.command,
            locator: request.locator,
            value: request.value,
            type: 'command'
          });

          this.selection.start = this.selection.end = this.selection.start + 1;
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

  }

  public highlight(ev, item) {
    chrome.tabs.sendMessage(window.currentTabId, { call: 'highlight', locator: item.locator }, function (highlighted) {
      highlight(ev.target.parentNode, highlighted ? PositiveColor : NegativeColor);
    });
  }

  public execute(ev, item) {
    ev.target.blur();
    item.message = undefined;
    item.state = undefined;

    chrome.tabs.sendMessage(window.currentTabId, {
      call: 'execute',
      commands: this.items,
      index: this.items.indexOf(item),
      count: 1,
      options: this.settings
    });
  }

  public selectElement(ev, item) {
    if (item.selecting) {
      delete item.selecting;
      chrome.tabs.sendMessage(window.currentTabId, { call: 'cancelSelect' });
      return;
    }
    this.items.forEach((it) => {
      delete it.selecting;
    });
    item.selecting = true;
    chrome.tabs.sendMessage(window.currentTabId, { call: 'select', locator: item.locator, index: this.items.indexOf(item) });
  }

  public add(type, index) {
    this.items.splice(index, 0, new TestCaseItem({ type: type } as TestCaseItem));

    // give new input field focus
    this.element.nativeElement.querySelector('.item-wrapper:nth-child(' + (index + 1) + ') .focus input').focus();
  }

  public remove(ev: MouseEvent, item: TestCaseItem) {
    this.items.splice(this.items.indexOf(item), 1);
    this.onChange.emit();
  }

  public trackByIndex(index: number, obj: any): any {
    return index;
  }

  public handleSelect(ev: MouseEvent, item: TestCaseItem, index: number) {
    if (ev.shiftKey) {
      // if(this.selection.start === this.selection.end)
      this.selection.end = index;
    } else {
      this.selection.start = this.selection.end = index;
    }
    if (this.selection.start > this.selection.end) {
      [this.selection.start, this.selection.end] = [this.selection.end, this.selection.start];
    }
    this.dragState.enabled = (<HTMLElement>ev.target).classList.contains('handle');
  }

  public handleDragStart(ev: DragEvent, item: TestCaseItem, index: number) {
    if (!this.dragState.enabled) {
      ev.preventDefault();
      return;
    }
    this.dragState.initialIndex = index;
    this.dragState.targetIndex = index;

    // Set the dropEffect to move
    ev.dataTransfer.dropEffect = 'move';
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text', `${item.command}|${item.locator}|${item.value}`);
    ev.dataTransfer.setData('text/html', `<tr><td>${item.command}</td><td>${item.locator}</td><td>|${item.value}</td></tr>`);
    ev.dataTransfer.setData('application/json', JSON.stringify(item));
  }

  public handleDragEnd(ev: DragEvent) {
    this.dragState.reset();
  }

  public handleDragEnter(ev: DragEvent, index: number) {
    const target = (<HTMLElement>ev.target);
    this.dragState.targetIndex = index;
    // depending on pointer position, decide whether the element should be added before or after
    const dragOver = (e: DragEvent) => {
      this.dragState.before = (e.clientY - target.offsetTop) <= target.offsetHeight / 2;
    };
    const dragLeave = () => {
      ev.target.removeEventListener('dragover', dragOver);
      ev.target.removeEventListener('dragleave', dragLeave);
    };
    ev.target.addEventListener('dragover', dragOver);
    ev.target.addEventListener('dragleave', dragLeave);

    dragOver(ev);
  }

  public handleDragOver(ev: DragEvent) {
    ev.preventDefault();
    // Set the dropEffect to move
    ev.dataTransfer.dropEffect = 'move';
  }

  public handleDrop(ev: DragEvent) {
    ev.preventDefault();
    if (typeof this.dragState.initialIndex === 'number' && typeof this.dragState.targetIndex === 'number' && this.dragState.initialIndex !== this.dragState.targetIndex) {
      const data = JSON.parse(ev.dataTransfer.getData('application/json') || '{}');
      let targetIndex = this.dragState.initialIndex > this.dragState.targetIndex ? (this.dragState.targetIndex + 1) : this.dragState.targetIndex;
      if (this.dragState.before) {
        targetIndex--;
      }
      this.items.splice(this.dragState.initialIndex, 1);
      this.items.splice(targetIndex, 0, new TestCaseItem(data as TestCaseItem));
      this.onChange.emit();
    }
  }
}

class DragState {
  public enabled = false;
  public initialIndex?: number;
  public targetIndex?: number;
  public before = false;

  public reset() {
    this.targetIndex = this.initialIndex = undefined;
    this.before = false;
  }
}
