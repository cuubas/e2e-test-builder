import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ContentService } from './content.service';

@NgModule({
  imports: [
    BrowserModule
  ],
  declarations: [],
  providers: [
    ContentService
  ]
})
export class ContentModule {
  constructor(private contentService: ContentService) { }

  public ngDoBootstrap() {
    this.contentService.init();
  }
}
