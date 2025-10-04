import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailabilityHeader } from './availability-header';

describe('AvailabilityHeader', () => {
  let component: AvailabilityHeader;
  let fixture: ComponentFixture<AvailabilityHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailabilityHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvailabilityHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
