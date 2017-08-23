var ioproxy = require('../../../common/ioproxy');

import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent implements OnInit {
  @Input() public extensions: {}[];
  @Input() public testCase;
  @Input() public settings;

  public reloadingExtensions: boolean;
  constructor() { }

  ngOnInit() {

  }
  addExtension(ev) {
    ioproxy.open(window.localStorage.lastPath)
      .then((file) => {
        if (/\.js$/.test(file.path)) {
          this.extensions.push(file);
          this.saveExtensions();
        } else {
          this.handleError("Please select javascript file");
        }
      })
      .catch(this.handleError);
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
    var step = function () {
      if (index >= this.extensions.length) {
        this.saveExtensions();
        this.reloadingExtensions = false;
        return;
      }
      ioproxy.read(this.extensions[index].path)
        .then((file) => {
          this.extensions[index] = file;
          index++;
          step();
        })
        .catch((error) => {
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