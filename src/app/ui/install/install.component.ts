import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { RequiredNativeClientVersion } from './../config';
import { Router } from "@angular/router";
import IoProxy from './../../common/ioproxy';

@Component({
  selector: 'app-install',
  templateUrl: './install.component.html',
  styleUrls: ['./install.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class InstallComponent implements OnInit {
  public hostLink: string;
  public nativeClientVersion: number;

  constructor(private router: Router) { }

  public ngOnInit() {
    let name = 'host.zip';
    let executable = 'register.sh';

    if (window.navigator.platform === 'Win32') {
      name = 'host-win.zip';
      executable = 'register.bat';
    }
    this.nativeClientVersion = window.localStorage.nativeClientVersion;
    this.hostLink = 'https://github.com/Cuubas/e2e-test-builder/releases/download/v1.0.0/' + name;
  }

  public verify(ev: Event) {
    ev.preventDefault();
    IoProxy.about().then((about) => {
      if (about.version === RequiredNativeClientVersion) {
        window.localStorage.nativeClientVersion = String(about.version);
        this.router.navigateByUrl('home');
      } else {
        alert("Version " + RequiredNativeClientVersion + " is required, found version " + about.version + ".");
      }
    }).catch((error) => {
      alert(error);
    });
  }
}
