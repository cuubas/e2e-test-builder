import { Injectable, Inject } from '@angular/core';
import { run } from './content.main';

@Injectable()
export class ContentService {

  constructor() { }

  public init(): void {
    run();
  }
}
