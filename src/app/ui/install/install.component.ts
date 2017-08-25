import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { RequiredNativeClientVersion } from 'app/ui/config';
import { Router } from "@angular/router";
import { IoProxy } from 'app/common/ioproxy';

@Component({
  selector: 'app-install',
  templateUrl: './install.component.html',
  styleUrls: ['./install.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class InstallComponent implements OnInit {
  public hostLink: string;
  public executable: string;
  public nativeClientVersion: number;

  constructor(
    private router: Router,
    private ioProxy: IoProxy
  ) { }

  public ngOnInit() {
    let name = 'host.zip';
    this.executable = 'register.sh';

    if (window.navigator.platform === 'Win32') {
      name = 'host-win.zip';
      this.executable = 'register.bat';
    }
    this.nativeClientVersion = window.localStorage.nativeClientVersion;
    this.hostLink = 'https://github.com/Cuubas/e2e-test-builder/releases/download/v1.0.0/' + name;
  }

  public verify(ev: Event) {
    ev.preventDefault();
    this.ioProxy.about().subscribe((about) => {
      if (about.version === RequiredNativeClientVersion) {
        window.localStorage.nativeClientVersion = String(about.version);
        this.router.navigateByUrl('home');
      } else {
        alert("Version " + RequiredNativeClientVersion + " is required, found version " + about.version + ".");
      }
    }, (error) => {
      alert(error);
    });
  }
}
