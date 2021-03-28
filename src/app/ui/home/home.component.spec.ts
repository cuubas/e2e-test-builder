import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IoProxy } from 'app/common/ioproxy';
import { HomeComponent } from './home.component';
import { SelectionRange } from 'app/common/model';
import * as MessengerWrapper from 'app/common/messenger';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(waitForAsync(() => {
    const titleStub = {}, ioProxyStub = {}, ngZoneStub = {};

    spyOn(MessengerWrapper.Messenger, 'send').and.stub();
    spyOn(MessengerWrapper.Messenger, 'bind').and.stub();

    TestBed.configureTestingModule({
      declarations: [HomeComponent, ListComponent, SettingsComponent, ReleaseNotesComponent],
      providers: [
        { provide: Title, useValue: titleStub },
        { provide: IoProxy, useValue: ioProxyStub }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    chrome.runtime.getManifest = jasmine.createSpy('getManifest').and.returnValue({ version: '1.1.3' });
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

});

@Component({
  selector: 'app-list',
  template: ''
})
class ListComponent {
  @Input() public items: any[];
  @Input() public recording: boolean;
  @Input() public selection: SelectionRange;
  @Input() public settings: any;
  @Output() change = new EventEmitter();
}

@Component({
  selector: 'app-settings',
  template: ''
})
class SettingsComponent {
  @Input() public extensions;
  @Input() public testCase;
  @Input() public settings;
}

@Component({
  selector: 'app-release-notes',
  template: ''
})
class ReleaseNotesComponent {
}
