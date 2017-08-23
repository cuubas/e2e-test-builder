import { Injectable } from '@angular/core';

@Injectable()
export class BackgroundService {

  constructor() { }

  public init(): void {
    console.info('background init');
  }

}
