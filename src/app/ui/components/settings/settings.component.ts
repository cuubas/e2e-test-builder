import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { IoProxy, FileResult } from 'app/common/ioproxy';
import { TestCase } from 'app/common/model';
import { IOptions as IRunnerOptions } from 'app/common/runner/options';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent implements OnInit {
  @Input() public extensions: FileResult[];
  @Input() public testCase: TestCase;
  @Input() public settings: IRunnerOptions;

  public reloadingExtensions: boolean;
  constructor(private ioProxy: IoProxy) { }

  ngOnInit() {

  }

  public addExtension(ev:MouseEvent) {
    this.ioProxy.open(window.localStorage.lastPath)
      .subscribe((file) => {
        if (/\.js$/.test(file.path)) {
          this.extensions.push(file);
          this.saveExtensions(ev);
        } else {
          this.handleError("Please select javascript file");
        }
      }, this.handleError);
  };

  public removeExtension(ev:MouseEvent, ext) {
    var index = this.extensions.indexOf(ext);
    if (index >= 0) {
      this.extensions.splice(index, 1);
      this.saveExtensions(ev);
    }
  };

  public reloadExtensions(ev:MouseEvent) {
    this.reloadingExtensions = true;
    var index = 0;
    var step = () => {
      if (index >= this.extensions.length) {
        this.saveExtensions(ev);
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

  public saveExtensions(ev:MouseEvent) {
    window.localStorage.extensions = JSON.stringify(this.extensions);
  };

  private handleError(error) {
    alert(error);
  }
}