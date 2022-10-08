import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { Routes, RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./home/home.component";
import { ListComponent } from "./components/list/list.component";
import { SettingsComponent } from "./components/settings/settings.component";
import { IoProxy } from "app/common/ioproxy";
import { ReleaseNotesComponent } from "./components/release-notes/release-notes.component";

const routes: Routes = [{ path: "home", component: HomeComponent }];
@NgModule({
  imports: [
    FormsModule,
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes, { useHash: true, relativeLinkResolution: 'legacy' }),
  ],
  providers: [IoProxy],
  declarations: [
    AppComponent,
    HomeComponent,
    ListComponent,
    SettingsComponent,
    ReleaseNotesComponent,
  ],
  bootstrap: [AppComponent],
})
export class UiModule {}
