import { Component, OnInit, ViewEncapsulation, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReleaseNotesLink } from 'app/ui/config';
@Component({
  selector: 'app-release-notes',
  templateUrl: './release-notes.component.html',
  styleUrls: ['./release-notes.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ReleaseNotesComponent implements OnInit {
  public releaseNotesUrl: string = ReleaseNotesLink;
  public version: string;
  constructor(
    private http: HttpClient,
    private element: ElementRef
  ) { }

  ngOnInit() {
    this.version = chrome.runtime.getManifest().version;
    this.http.get(this.releaseNotesUrl, { responseType: 'text' }).subscribe((content) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content.substring(content.indexOf('<body'), content.indexOf('</body') + 1), 'text/html');
      const latestNotes = doc.querySelector('[data-test-selector="release-card"] [data-test-selector="body-content"]');
      const target: HTMLElement = this.element.nativeElement.querySelector('.release-notes-placeholder');
      if (latestNotes) {
        this.makeLinksExternal(latestNotes);
        target.innerHTML = '';
        target.appendChild(latestNotes);
      } else {
        target.innerHTML = 'Couldn\'t load latest release notes from GitHub';
      }
    });
  }

  private makeLinksExternal(source: Element) {
    const links = source.querySelectorAll('a');
    Array.prototype.forEach.call(links, (link: HTMLAnchorElement) => {
      link.target = '_blank';
    });
  }
}
