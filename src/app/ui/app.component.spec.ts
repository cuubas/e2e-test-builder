import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AppComponent } from './app.component';
import { Router } from "@angular/router";

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockWindow;
  beforeEach(async(() => {
    mockWindow = {
      $registerUiWindow: jasmine.createSpy('$registerUiWindow').and.stub()
    };
    let mockRouter = {
      navigateByUrl: jasmine.createSpy('navigateByUrl').and.stub()
    };
    chrome.runtime = {} as any;
    chrome.runtime.getBackgroundPage = jasmine.createSpy('getBackgroundPage').and.callFake((cb) => { cb && cb(mockWindow); })
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [AppComponent],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
  }));

  function initComponent() {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should navigate to install', () => {
    window.localStorage.nativeClientVersion = 0;
    initComponent();
    expect(fixture.debugElement.injector.get(Router).navigateByUrl).toHaveBeenCalledWith('install');
  });

  it('should navigate to home', () => {
    window.localStorage.nativeClientVersion = 1;
    initComponent();
    expect(fixture.debugElement.injector.get(Router).navigateByUrl).toHaveBeenCalledWith('home');
  });

  it('should call $registerUiWindow on init', () => {
    initComponent();
    expect(mockWindow.$registerUiWindow).toHaveBeenCalled();
  })
});
