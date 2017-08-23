import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from "@angular/router";
import { RequiredNativeClientVersion } from './config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  constructor(private router: Router) { }

  public ngOnInit(): void {
    let path = parseInt(window.localStorage.nativeClientVersion) === RequiredNativeClientVersion ? 'home' : 'install';
    this.router.navigateByUrl(path)
  }

}
