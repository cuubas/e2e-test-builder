import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IoProxy } from 'app/common/ioproxy';
import { InstallComponent } from './install.component';

describe('InstallComponent', () => {
  let component: InstallComponent;
  let fixture: ComponentFixture<InstallComponent>;
  beforeEach(async(() => {
    const mockRouter = {},
      mockIoProxy = {};
    TestBed.configureTestingModule({
      declarations: [InstallComponent],
      providers: [
        {
          provide: Router,
          useValue: mockRouter
        },
        {
          provide: IoProxy,
          useValue: mockIoProxy
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
