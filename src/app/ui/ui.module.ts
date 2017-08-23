import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { UiComponent } from './ui.component';

@NgModule({
  declarations: [
    UiComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [UiComponent]
})
export class UiModule { }
