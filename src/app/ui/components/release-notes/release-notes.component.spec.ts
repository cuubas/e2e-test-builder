import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleaseNotesComponent } from './release-notes.component';

describe('ReleaseNotesComponent', () => {
  let component: ReleaseNotesComponent;
  let fixture: ComponentFixture<ReleaseNotesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReleaseNotesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReleaseNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
