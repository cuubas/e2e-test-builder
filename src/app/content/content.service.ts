import { Injectable, Inject } from '@angular/core';
import { run } from './../content.main';
@Injectable()
export class ContentService {

  constructor(@Inject(Window) private window: Window) { }

  public init(): void {
    this.window.alert('foo');
    console.info('content init');
    run();
  }
}
