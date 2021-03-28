import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';

@Injectable()
export class IoProxy {
  private packageName = 'com.cuubas.ioproxy';

  public constructor(private ngZone: NgZone) {

  }

  public about(): Observable<AboutResult> {
    return Observable.create((observer: Observer<AboutResult>) => {
      chrome.runtime.sendNativeMessage(this.packageName,
        {
          op: 'about'
        },
        this.genericCallback.bind(this, observer)
      );
    });
  }

  public open(lastPath): Observable<FileResult> {
    return Observable.create((observer: Observer<FileResult>) => {
      chrome.runtime.sendNativeMessage(this.packageName,
        {
          op: 'open',
          lastPath: lastPath
        },
        this.genericCallback.bind(this, observer)
      );
    });
  }

  public read(path): Observable<FileResult> {
    return Observable.create((observer: Observer<FileResult>) => {
      chrome.runtime.sendNativeMessage(this.packageName,
        {
          op: 'read',
          path: path
        },
        this.genericCallback.bind(this, observer)
      );
    });
  }

  public write(path, data, lastPath): Observable<FileResult> {
    return Observable.create((observer: Observer<FileResult>) => {
      chrome.runtime.sendNativeMessage(this.packageName,
        {
          op: 'write',
          path: path,
          data: data,
          lastPath: lastPath
        },
        this.genericCallback.bind(this, observer)
      );
    });
  }

  private genericCallback(observer: Observer<any>, response) {
    this.ngZone.run(() => {
      if (response && response.code > 0) {
        observer.next(response);
        observer.complete();
      } else {
        if (response && response.stacktrace) {
          console.warn(response.message, response.stacktrace);
        }
        observer.error((chrome.runtime.lastError && chrome.runtime.lastError.message) || (response && response.message) || 'unknown error');
      }
    });
  }
}

export class FileResult {
  public path: string;
  public data: string;
}

export class AboutResult {
  public version: number;
}
