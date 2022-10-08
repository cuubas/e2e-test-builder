import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { ReleaseNotesComponent } from './release-notes.component';

describe('ReleaseNotesComponent', () => {
  let component: ReleaseNotesComponent;
  let fixture: ComponentFixture<ReleaseNotesComponent>;

  beforeEach(waitForAsync(() => {
    const fakeHttp = {
      get: () => {
        return {
          subscribe: (cb) => {
            cb('<html><head></head><body><div class="release label-latest"><div class="markdown-body">Hi!</div></div></body></html>');
          }
        };
      }
    };
    TestBed.configureTestingModule({
      declarations: [ReleaseNotesComponent],
      providers: [
        { provide: HttpClient, useValue: fakeHttp }
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
