import { Injectable } from "@angular/core";
import { from } from "rxjs";
import { Observable } from "rxjs/Observable";

@Injectable()
export class IoProxy {
  public constructor() {
  }

  public open(): Observable<any> {
    return from(
      (async () => {
        const [handle] = await window["showOpenFilePicker"]();

        const file = await handle.getFile();
        return {
          handle,
          path: file.name,
          data: await file.text(),
        };
      })()
    );
  }

  public read(handle: any): Observable<any> {
    return from(
      (async () => {
        const file = await handle.getFile();
        return {
          handle,
          path: file.name,
          data: await file.text(),
        };
      })()
    );
  }

  public write(handle, data, suggestedName): Observable<any> {
    return from(
      (async () => {
        if (!handle) {
          handle = await window["showSaveFilePicker"]({
            suggestedName,
          });
        }
        const writable = await handle.createWritable();

        // Write the contents of the file to the stream.
        await writable.write(data);

        // Close the file and write the contents to disk.
        await writable.close();

        return this.read(handle).toPromise();
      })()
    );
  }
}

export class FileResult {
  handle: any;
  path: string;
  data: string;
}

export class AboutResult {
  version: number;
}
