import 'polyfills';
import { BackgroundService } from './background.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule
  ],
  providers: [BackgroundService],
})
export class BackgroundModule {
  constructor(private backgroundService: BackgroundService) {

  }

  public ngDoBootstrap() {
    this.backgroundService.init();
  }
}
