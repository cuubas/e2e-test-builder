import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { DBName, DBVersion } from "./config";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  public ngOnInit(): void {
    // register this window with background page (in case window is reloaded)
    chrome.runtime.getBackgroundPage((page) => {
      page.$registerUiWindow(window);
    });
    this.router.navigateByUrl("home", { replaceUrl: true });
  }
}
