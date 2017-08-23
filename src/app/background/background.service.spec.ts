import { TestBed, inject } from '@angular/core/testing';

import { BackgroundService } from './background.service';

describe('BackgroundService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BackgroundService]
    });
  });

  it('should be created', inject([BackgroundService], (service: BackgroundService) => {
    expect(service).toBeTruthy();
  }));
});
