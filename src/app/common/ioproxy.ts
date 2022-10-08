import { Injectable } from "@angular/core";
import { from, Observable } from "rxjs";

@Injectable()
export class IoProxy {
  public constructor() {
  }

  public open(): Observable<FileResult> {
    return from(
      (async () => {
        const [handle] = await window.showOpenFilePicker();

        const file = await handle.getFile();
        return {
          handle,
          path: file.name,
          data: await file.text(),
        };
      })()
    );
  }

  public read(handle: FileSystemFileHandle): Observable<FileResult> {
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

  public write(handle: FileSystemFileHandle | undefined, data: string, suggestedName?: string): Observable<FileResult> {
    return from(
      (async () => {
        if (!handle) {
          handle = await window.showSaveFilePicker({
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

export interface FileResult {
  handle: FileSystemFileHandle;
  path: string;
  data: string;
}
