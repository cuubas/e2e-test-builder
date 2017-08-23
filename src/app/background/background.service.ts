import { Injectable } from '@angular/core';
import { run } from './background.main';

@Injectable()
export class BackgroundService {

  constructor() { }

  public init(): void {
    run();
  }

}
