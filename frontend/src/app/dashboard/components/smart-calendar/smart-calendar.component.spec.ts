import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartCalendarComponent } from './smart-calendar.component';

describe('SmartCalendarComponent', () => {
  let component: SmartCalendarComponent;
  let fixture: ComponentFixture<SmartCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SmartCalendarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmartCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});