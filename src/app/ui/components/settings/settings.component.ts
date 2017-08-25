import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { IoProxy, FileResult } from 'app/common/ioproxy';
import { TestCase } from 'app/common/model';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent implements OnInit {
  @Input() public extensions: FileResult[];
  @Input() public testCase: TestCase;
  @Input() public settings;

  public reloadingExtensions: boolean;
  constructor(private ioProxy: IoProxy) { }

  ngOnInit() {

  }
  addExtension(ev) {
    this.ioProxy.open(window.localStorage.lastPath)
      .subscribe((file) => {
        if (/\.js$/.test(file.path)) {
          this.extensions.push(file);
          this.saveExtensions();
        } else {
          this.handleError("Please select javascript file");
        }
      }, this.handleError);
  };

  removeExtension(ev, ext) {
    var index = this.extensions.indexOf(ext);
    if (index >= 0) {
      this.extensions.splice(index, 1);
      this.saveExtensions();
    }
  };

  reloadExtensions() {
    this.reloadingExtensions = true;
    var index = 0;
    var step = () => {
      if (index >= this.extensions.length) {
        this.saveExtensions();
        this.reloadingExtensions = false;
        return;
      }
      this.ioProxy.read(this.extensions[index].path)
        .subscribe((file) => {
          this.extensions[index] = file;
          index++;
          step();
        }, (error) => {
          this.reloadingExtensions = false;
          this.handleError(error);
        });
    };
    step();
  };

  saveExtensions() {
    window.localStorage.extensions = JSON.stringify(this.extensions);
  };

  handleError(error) {
    alert(error);
  }
}