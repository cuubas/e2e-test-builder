import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Http } from '@angular/http';
import { By } from '@angular/platform-browser';
import { ReleaseNotesComponent } from './release-notes.component';

describe('ReleaseNotesComponent', () => {
  let component: ReleaseNotesComponent;
  let fixture: ComponentFixture<ReleaseNotesComponent>;

  beforeEach(async(() => {
    const fakeHttp = {
      get: () => {
        return {
          subscribe: (cb) => {
            cb({
              text: () => '<html><head></head><body><div class="release label-latest"><div class="markdown-body">Hi!</div></div></body></html>'
            });
          }
        };
      }
    };
    TestBed.configureTestingModule({
      declarations: [ReleaseNotesComponent],
      providers: [
        { provide: Http, useValue: fakeHttp }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    chrome.runtime.getManifest = jasmine.createSpy('getManifest').and.returnValue({ version: '1.2.1' });
    fixture = TestBed.createComponent(ReleaseNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load release notes from github', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.release-notes-placeholder .markdown-body').length).toBe(1);
  });

});
