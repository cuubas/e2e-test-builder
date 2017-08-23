import { NgModule, } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { InstallComponent } from './install/install.component';
import { ListComponent } from './components/list/list.component';
import { SettingsComponent } from './components/settings/settings.component';
import { Routes, RouterModule } from "@angular/router";

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'install', component: InstallComponent }
];
@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes, { useHash: true })
  ],
  declarations: [AppComponent, HomeComponent, InstallComponent, ListComponent, SettingsComponent],
  bootstrap: [AppComponent]
})
export class UiModule { }
